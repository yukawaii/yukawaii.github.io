import { emojis } from './emojis.js';

const getEmojis = (count) => {
  let randomEmojis = [];
  while (randomEmojis.length < count) {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    if (randomEmojis.indexOf(randomEmoji) === -1) {
      randomEmojis.push(randomEmoji);
    }
  }
  return randomEmojis;
};

export { getEmojis };
