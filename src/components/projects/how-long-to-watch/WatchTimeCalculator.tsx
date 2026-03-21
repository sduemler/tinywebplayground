import { useState } from 'react';
import SearchPane from './SearchPane';
import PresetPane from './PresetPane';
import WatchlistPane from './WatchlistPane';
import styles from './WatchTimeCalculator.module.css';

type Tab = 'search' | 'presets';

export default function WatchTimeCalculator() {
  const [tab, setTab] = useState<Tab>('search');

  return (
    <div className={styles.layout}>
      <div className={styles.leftPanel}>
        <div className={styles.tabs}>
          <button
            className={tab === 'search' ? styles.activeTab : styles.tab}
            onClick={() => setTab('search')}
          >
            Search
          </button>
          <button
            className={tab === 'presets' ? styles.activeTab : styles.tab}
            onClick={() => setTab('presets')}
          >
            Presets
          </button>
        </div>
        <div className={styles.tabContent}>
          {tab === 'search' ? <SearchPane /> : <PresetPane />}
        </div>
      </div>

      <div className={styles.rightPanel}>
        <WatchlistPane />
      </div>
    </div>
  );
}
