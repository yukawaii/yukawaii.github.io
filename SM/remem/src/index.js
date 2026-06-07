import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import bridge from '@vkontakte/vk-bridge';

// Отправляет событие нативному клиенту
bridge.send("VKWebAppInit", {});
// Подписывается на события, отправленные нативным клиентом
bridge.subscribe((e) => console.log(e)); 

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
