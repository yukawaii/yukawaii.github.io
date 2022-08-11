import styles from './Footer.module.scss';

const Footer = () => {
  return (
    <div className={styles.container}>
      <a
        className={styles.link}
        href="http://github.com/FrancisLangit/rememoji"
        target="_blank"
        rel="noopener noreferrer"
      >
        About
      </a>
      <span> • </span>
      <a
        className={styles.link}
        href="http://github.com/FrancisLangit/rememoji#how-to-play"
        target="_blank"
        rel="noopener noreferrer"
      >
        How To Play
      </a>
      <span> • </span>
      <a
        className={styles.link}
        href="http://github.com/FrancisLangit"
        target="_blank"
        rel="noopener noreferrer"
      >
        Author
      </a>
      <span> • </span>
      <a
        className={styles.link}
        href="https://github.com/FrancisLangit/rememoji/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
      >
        License
      </a>
    </div>
  );
};

export { Footer };
