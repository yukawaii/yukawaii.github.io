import { useState } from 'react';

import styles from './styles/styles.module.scss';

const Form = ({
  emojiCount,
  setEmojiCount,
  setGamestate,
  isShow,
  setIsShow,
}) => {
  const [value, setValue] = useState(emojiCount);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setEmojiCount(parseInt(value));
    setGamestate(-2);
    setIsShow(false);
  };

  return (
    <div className={isShow ? styles.visible : styles.hidden}>
      <div className={styles.container}>
        <div className={styles.modal}>
          <div className={styles.modalText}>How many emojis?</div>
          <form onSubmit={handleSubmit}>
            <input
              className={styles.formValue}
              type="number"
              value={value}
              min={2}
              max={30}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
            />
            <input className={styles.formSubmit} type="submit" value="Submit" />
            <div className={styles.formCancel} onClick={() => setIsShow(false)}>
              Cancel
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { Form };
