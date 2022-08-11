import { useState } from 'react';

import styles from './App.module.scss';

import { EndScreen } from './components/EndScreen/EndScreen';
import { Footer } from './components/Footer/Footer';
import { Game } from './components/Game/Game';
import { Header } from './components/Header/Header';
import { Settings } from './components/Settings/Settings';

const App = () => {
  const [emojiCount, setEmojiCount] = useState(12);
  const [gamestate, setGamestate] = useState(0);

  if (gamestate === -1) {
    return <EndScreen text="u lawst 🙃" setGamestate={setGamestate} />;
  } else if (gamestate === 1) {
    return <EndScreen text="u 1!!! 🏆" setGamestate={setGamestate} />;
  } else {
    return (
      <div className={styles.App}>
        <Header />
        <Game
          emojiCount={emojiCount}
          gamestate={gamestate}
          setGamestate={setGamestate}
        />
        <Settings
          emojiCount={emojiCount}
          setEmojiCount={setEmojiCount}
          setGamestate={setGamestate}
        />
        <Footer />
      </div>
    );
  }
};

export default App;
