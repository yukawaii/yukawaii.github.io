import styles from './EndScreen.module.scss';

import { RestartButton } from '../RestartButton/RestartButton';

const EndScreen = ({ text, setGamestate }) => {
  return (
    <div className={styles.container}>
      <div className={styles.text}>{text}</div>
      <RestartButton setGamestate={setGamestate} />
    </div>
  );
};

export { EndScreen };
