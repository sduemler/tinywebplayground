import styles from './AlbumCover.module.css';

interface AlbumCoverProps {
  imageUrl: string;
  state: 'hidden' | 'blurred' | 'revealed';
}

export default function AlbumCover({ imageUrl, state }: AlbumCoverProps) {
  return (
    <div className={styles.cover} data-state={state}>
      {imageUrl && (
        <img src={imageUrl} alt="" className={styles.image} aria-hidden="true" />
      )}
      {state === 'hidden' && (
        <div className={styles.overlay}>
          <span className={styles.questionMark}>?</span>
        </div>
      )}
    </div>
  );
}
