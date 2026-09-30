export const PRESET_PLAYLISTS: Array<{ id: string; label: string }> = [
  { id: '37i9dQZF1DXaKIA8E7WcJj', label: 'All Out 60s' },
  { id: '37i9dQZF1DWTJ7xPn4vNaz', label: 'All Out 70s' },
  { id: '37i9dQZF1DX4UtSsGT1Sbe', label: 'All Out 80s' },
  { id: '37i9dQZF1DXbTxeAdrVG2l', label: 'All Out 90s' },
  { id: '37i9dQZF1DX4o1oenSJRJd', label: 'All Out 2000s' },
  { id: '37i9dQZF1DX5Ejj0EkURtP', label: 'All Out 2010s' },
  { id: '37i9dQZF1DWXRqgorJj26U', label: 'Rock Classics' },
  { id: '37i9dQZF1DX186v583rmzp', label: "I Love My '90s Hip-Hop" },
  { id: '37i9dQZF1DXb69UWhjrXsW', label: 'Hits From The Movies' },
  { id: '37i9dQZF1DWZBCPUIUs2iR', label: "Country's Greatest Hits" },
];

export function parsePlaylistInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9]{15,}$/.test(trimmed)) return trimmed;
  return null;
}
