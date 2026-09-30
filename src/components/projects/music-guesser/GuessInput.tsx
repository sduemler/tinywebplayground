import { useEffect, useRef, useState } from 'react';
import { apiFetch, isDuplicateVersion, typedFullTitle } from './utils';
import type { SearchResult, Track } from './types';
import styles from './GuessInput.module.css';

interface GuessInputProps {
  disabled?: boolean;
  onSubmit: (result: SearchResult) => void;
  placeholder?: string;
  currentTrack?: Track;
}

export default function GuessInput({ disabled, onSubmit, placeholder, currentTrack }: GuessInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ success: boolean; results: SearchResult[] }>(
          `/api/music/search?q=${encodeURIComponent(query.trim())}`
        );
        let filtered = data.results || [];
        if (currentTrack) {
          // Search may return a different release of the answer (remaster, live,
          // single...). Swap any such version for the exact answer track, in the
          // spot search put it, so the right pick is selectable without the list
          // revealing anything search itself didn't.
          const answer = { id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist };
          let answerShown = false;
          filtered = filtered.flatMap((r) => {
            if (r.id !== answer.id && !isDuplicateVersion(r, currentTrack)) return [r];
            if (answerShown) return [];
            answerShown = true;
            return [answer];
          });
          // If search missed it entirely, only surface it once the player has
          // typed its whole title. Artist names or partial words never do.
          if (!answerShown && typedFullTitle(query, currentTrack.title)) {
            filtered = [answer, ...filtered];
          }
        }
        setResults(filtered);
        setOpen(true);
        setHighlightIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, selected]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setSelected(result);
    setQuery(`${result.title} — ${result.artist}`);
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setResults([]);
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    handleClear();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter' && selected) handleSubmit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder ?? 'Search for a song…'}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKey}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {selected ? (
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={disabled}
          >
            Guess
          </button>
        ) : (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            disabled={disabled || query.length === 0}
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === highlightIndex}
              className={`${styles.option} ${i === highlightIndex ? styles.optionActive : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(r);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className={styles.optionTitle}>{r.title}</span>
              <span className={styles.optionArtist}>{r.artist}</span>
            </li>
          ))}
        </ul>
      )}

      {loading && <div className={styles.loadingNote}>Searching…</div>}
    </div>
  );
}
