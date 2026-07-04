import React from 'react';

export default class ModeShapes extends React.Component {
  constructor() {
    super();
 // Берем режим из window, который уже установлен в modes.js
    var initialMode = (typeof window !== 'undefined' && window.currentGameMode) || 'tetra';
    this.state = {
      currentMode: initialMode,
    };
  }

  componentDidMount() {
    // Проверяем каждые 500ms
    this.interval = setInterval(() => {
      var mode = window.currentGameMode;
      if (mode && mode !== this.state.currentMode) {
        this.setState({ currentMode: mode });
      }
    }, 500);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  
  render() {
    var mode = this.state.currentMode || 'tetra';
    var modeText = mode === 'tetra' ? 'ТЕТРА' : 'КЛАССИКА';
    
    return (
      <div style={{
        position: 'absolute',
        bottom: '25px',
        right: '4px',
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid #ffd700',
        borderRadius: '8px',
        padding: '8px',
        color: '#ffd700',
        fontSize: '12px',
        zIndex: 100
      }}>
        {modeText}
      </div>
    );
  }
}