import styles from './Emoji.module.scss';

const Emoji = ({ emoji, clickedEmojis, setClickedEmojis }) => {
  const handleClick = () => {
    setClickedEmojis([...clickedEmojis, emoji]);
  };

  return (
    <div className={styles.container} onClick={handleClick}>
      {emoji}
    </div>
  );
};

export { Emoji };
