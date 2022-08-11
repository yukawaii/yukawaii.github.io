import styles from './Header.module.scss';

const Header = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>rememoji</div>
      <div className={styles.subtitle}>don't choose twice</div>
    </div>
  );
};

export { Header };
