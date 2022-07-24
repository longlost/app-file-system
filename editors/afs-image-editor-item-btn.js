

/**
  * `afs-image-editor-item-btn`
  * 
  *   
  *   An animated action button.
  *
  *
  *
  *  Properites:
  *
  *
  *     
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *    
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement}    from '@longlost/app-core/app-element.js';
import {getRootTarget} from '@longlost/app-core/utils.js';
import template        from './afs-image-editor-item-btn.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import './afs-image-editor-icons.js';


class AFSImageEditorItemBtn extends AppElement {
  
  static get is() { return 'afs-image-editor-item-btn'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      animated: {
        type: Boolean,
        value: false
      },

      disabled: Boolean,

      icon: String,

      label: String,

      _disabled: {
        type: Boolean,
        computed: '__computeDisabled(animated, disabled)'
      },

      _icon: {
        type: String,
        computed: '__computeIcon(icon)'
      },

      _btnClass: {
        type: String,
        computed: '__computeBtnClass(animated)'
      },

      _btnAnimationClass: {
        type: String,
        computed: '__computeBtnAnimationClass(animated, disabled)'
      },

      _circleClass: String,

      _labelClass: String,

      _rectangleClass: String

    };
  }


  static get observers() {
    return [
      '__connectedLabelChanged(customElementConnected, label)'
    ];
  }


  __computeDisabled(animated, disabled) {

    return animated ? false : disabled;
  }


  __computeIcon(str) {

    return `afs-image-editor-icons:${str}`;
  }


  __computeBtnClass(animated) {

    return animated ? 'btn' : '';
  }


  __computeBtnAnimationClass(animated, disabled) {

    if (!animated) { return ''; }

    return disabled ? 'hide-btn' : 'show-btn';
  }


  __measureLabelWidth() {

    const label   = this.select('.label');
    const {width} = label.getBoundingClientRect();
    const padding = 8;

    this.updateStyles({'--btn-label-width': `${width + padding}px`});
  }


  __connectedLabelChanged(connected, label) {

    if (!connected || !label) { return; }

    this.__measureLabelWidth();
  }

  // Handle 'animationend' and 'animationcancel'.
  __onAnimationHandler() {

    this._overflowClass  = '';
    this._circleClass    = '';
    this._labelClass     = '';
    this._rectangleClass = '';
  }

  // Handle 'transistionend' and 'transitioncancel'.
  __onTransitionHandler(event) {

    if (
      !(event instanceof TransitionEvent) || 
      event.propertyName !== 'transform'  ||
      getRootTarget(event).nodeName !== 'PAPER-BUTTON'
    ) {
      return;
    }

    if (this._btnAnimationClass === 'show-btn') {

      this._overflowClass  = 'allow-overflow';
      this._circleClass    = 'circle-enter';
      this._labelClass     = 'show-label';
      this._rectangleClass = 'rectangle-enter';
    }
  }

}

window.customElements.define(AFSImageEditorItemBtn.is, AFSImageEditorItemBtn);
