import bridge from '@vkontakte/vk-bridge';

// Sends event to client
bridge.send('VKWebAppInit');

// Subscribes to event, sended by client
bridge.subscribe(e => console.log(e));