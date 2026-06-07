import styles from './EndScreen.module.scss';

import { RestartButton } from '../RestartButton/RestartButton';

const EndScreen = ({ text, setGamestate }) => {
  bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
  return (
    <div className={styles.container}>
      <div className={styles.text}>{text}</div>
      <RestartButton setGamestate={setGamestate} />
    </div>
  );
};

export { EndScreen };
