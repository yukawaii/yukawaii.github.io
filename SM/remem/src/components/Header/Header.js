import styles from './Header.module.scss';

const Header = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>Супер-память</div>
      <div className={styles.subtitle}>Не выбирай дважды одно и то же!</div>
    </div>
  );
};

export { Header };
