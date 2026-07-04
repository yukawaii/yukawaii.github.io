// components/keyboard/button/index.js
import React from 'react';
import cn from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';
import { transform } from '../../../unit/const';

export default class Button extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.active !== this.props.active ||
           nextProps.disabled !== this.props.disabled;  // ← ДОБАВЛЕНО
  }
  
  render() {
    const {
      active, color, size, top, left, label, position, arrow, disabled
    } = this.props;
    
    // Для отладки - можно раскомментировать:
   // console.log('Button render:', label, 'disabled:', disabled);
    
    return (
      <div
        className={cn({
          [style.button]: true,
          [style[color]]: true,
          [style[size]]: true,
          [style.disabled]: disabled
        })}
        style={{ top, left, opacity: disabled ? 0.4 : 1 }}
      >
        <i
          className={cn({ [style.active]: active })}
          ref={(c) => { this.dom = c; }}
        />
        { size === 's1' && <em
          style={{
            [transform]: `${arrow} scale(1,2)`,
          }}
        /> }
        <span className={cn({ [style.position]: position })}>{label}</span>
      </div>
    );
  }
}

Button.propTypes = {
  color: propTypes.string.isRequired,
  size: propTypes.string.isRequired,
  top: propTypes.number.isRequired,
  left: propTypes.number.isRequired,
  label: propTypes.string.isRequired,
  position: propTypes.bool,
  arrow: propTypes.string,
  active: propTypes.bool.isRequired,
  disabled: propTypes.bool,  // ← ДОБАВЛЕНО
};