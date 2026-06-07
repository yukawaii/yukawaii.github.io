import styles from './Button.module.scss';

const Button = ({ setIsShow }) => {
  return (
    <div className={styles.buttonContainer}>
      <div className={styles.button} onClick={() => setIsShow(true)}>
        ⚙️ Settings
      </div>
    </div>
  );
};

export { Button };
