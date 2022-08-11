import { useState, useEffect } from 'react';

import { Emoji } from '../Emoji/Emoji';

import { getEmojis } from './helpers/getEmojis';
import { getShuffledArray } from './helpers/getShuffledArray';
import { hasDuplicates } from './helpers/hasDuplicates';
import styles from './Game.module.scss';

const Game = ({ emojiCount, gamestate, setGamestate }) => {
  const [emojis, setEmojis] = useState(getEmojis(emojiCount));
  const [clickedEmojis, setClickedEmojis] = useState([]);

  // If the user clicks on an emoji previously clicked on, the game is lost.
  // Else, increment score and shuffle gameboard when a user clicks on an emoji.
  useEffect(() => {
    if (hasDuplicates(clickedEmojis)) {
      setGamestate(-1);
    } else {
      setEmojis((emojis) => getShuffledArray([...emojis]));
    }
  }, [clickedEmojis, setGamestate]);

  // Restart the game if and when passed prop "gamestate" is -2.
  useEffect(() => {
    if (gamestate === -2) {
      setClickedEmojis([]);
      setEmojis(getEmojis(emojiCount));
      setGamestate(0);
    }
  }, [emojiCount, gamestate, setGamestate]);

  // Detect if the game has been won.
  useEffect(() => {
    if (
      clickedEmojis.length === emojiCount &&
      clickedEmojis.sort().join(',') === emojis.sort().join(',') &&
      !hasDuplicates(clickedEmojis)
    ) {
      setGamestate(1);
    }
  }, [clickedEmojis, emojis, emojiCount, setGamestate]);

  return (
    <div>
      <div className={styles.board} key={Math.random()}>
        {emojis.map((emoji) => (
          <Emoji
            key={`game-${emoji}`}
            emoji={emoji}
            clickedEmojis={clickedEmojis}
            setClickedEmojis={setClickedEmojis}
          />
        ))}
      </div>
      <div className={styles.score}>
        {clickedEmojis.length} of {emojis.length} emojis.
      </div>
    </div>
  );
};

export { Game };
