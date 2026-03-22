import SearchPane from './SearchPane';
import WatchlistPane from './WatchlistPane';
import styles from './WatchTimeCalculator.module.css';

export default function WatchTimeCalculator() {
  return (
    <div className={styles.layout}>
      <div className={styles.leftPanel}>
        <div className={styles.tabContent}>
          <SearchPane />
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.rightPanel}>
          <WatchlistPane />
        </div>
        <div className={styles.tmdbAttribution}>
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg"
            alt="The Movie Database"
            className={styles.tmdbLogo}
          />
        </div>
      </div>
    </div>
  );
}
