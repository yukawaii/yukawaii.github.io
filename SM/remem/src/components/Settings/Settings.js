import { useState } from 'react';

import { Button } from './components/Button/Button';
import { Form } from './components/Form/Form';

const Settings = ({ emojiCount, setEmojiCount, setGamestate }) => {
  const [isShow, setIsShow] = useState(false);

  return (
    <>
      <Form
        emojiCount={emojiCount}
        setEmojiCount={setEmojiCount}
        setGamestate={setGamestate}
        isShow={isShow}
        setIsShow={setIsShow}
      />
      <Button setIsShow={setIsShow} />
    </>
  );
};

export { Settings };
