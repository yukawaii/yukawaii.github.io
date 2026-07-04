// src/components/Notification/index.js
import React, { Component } from 'react';
import style from './index.less';

class Notification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: []
    };
    this.notificationId = 0;
    this.showNotification = this.showNotification.bind(this);
    this.removeNotification = this.removeNotification.bind(this);
  }

  componentDidMount() {
    window._showNotification = this.showNotification;
  }

  componentWillUnmount() {
    // Очищаем при размонтировании
    window._showNotification = null;
  }

  showNotification(message, icon, duration) {
    duration = duration || 3000;
    var id = ++this.notificationId;
    var notification = {
      id: id,
      message: message,
      icon: icon || '📢',
      duration: duration
    };
    
    var newNotifications = this.state.notifications.concat([notification]);
    this.setState({ notifications: newNotifications });
    
    setTimeout(function() {
      this.removeNotification(id);
    }.bind(this), duration);
  }

  removeNotification(id) {
    var newNotifications = this.state.notifications.filter(function(n) {
      return n.id !== id;
    });
    this.setState({ notifications: newNotifications });
  }

  render() {
    if (this.state.notifications.length === 0) return null;

    var notifications = this.state.notifications;

    return (
      <div className={style.container}>
        {notifications.map(function(notif, index) {
          var bottomPos = 20 + index * 80;
          return (
            <div 
              key={notif.id}
              className={style.notification}
              style={{ 
                bottom: bottomPos + 'px'
              }}
            >
              <span className={style.icon}>{notif.icon}</span>
              <span className={style.message}>{notif.message}</span>
            </div>
          );
        })}
      </div>
    );
  }
}

export default Notification;