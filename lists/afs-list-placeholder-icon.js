
/**
  * `afs-list-placeholder-icon`
  * 
  *   An animated face icon that is used as a fun placeholder for lists with no items. 
  *
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
  *
  *  
  *  Methods:
  *
  *
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


import {AppElement, html}      from '@longlost/app-element/app-element.js';
import {hijackEvent, schedule} from '@longlost/utils/utils.js';
import htmlString              from './afs-list-placeholder-icon.html';
import '@longlost/app-shared-styles/app-shared-styles.js';


class AFSListPlaceholderIcon extends AppElement {
  static get is() { return 'afs-list-placeholder-icon'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      playing: Boolean,

      _currentLookClass: {
        type: String,
        value: 'look-straight'
      },

      _lookingClasses: {
        type: Array,
        value: [
          'look-straight',
          'look-down',
          'look-left',
          'look-right',
          'look-down-left',
          'look-down-right'
        ],
      }

    };
  }


  static get observers() {
    return [
      '__playingChanged(playing)'
    ];
  }


  constructor() {
    super();

    this.__animateBlinking = this.__animateBlinking.bind(this);
    this.__animateLooking  = this.__animateLooking.bind(this);
  }


  __playingChanged(playing) {
    if (playing) {
      this.__startAnimation();
    }
    else {
      this.__stopAnimation();
    }
  }


  __animateBlinking(event) {

    if (event) {
      hijackEvent(event);
    }   

    window.requestAnimationFrame(async () => {      
      const random = Math.min(Math.random() * 10, 6);

      this.$.eyesPath.classList.remove('blink');
      this.updateStyles({'--blink-delay': `${random}s`});

      await schedule();

      this.$.eyesPath.classList.add('blink');
    });
  }


  __animateLooking(event) {

    if (event) {
      hijackEvent(event);
    } 

    window.requestAnimationFrame(async () => {      
      const randomDelay  = Math.max(Math.random() * 3, 0.8);
      const randomIndex  = Math.floor(Math.random() * 5);     
      const otherClasses = this._lookingClasses.filter(str => 
                             str !== this._currentLookClass);


      this.$.wrapper.classList.remove(`wrapper-${this._currentLookClass}`);
      this.$.eyes.classList.remove(this._currentLookClass);
      this.updateStyles({'--look-delay': `${randomDelay}s`});

      await schedule();

      this._currentLookClass = otherClasses[randomIndex];

      this.$.wrapper.classList.add(`wrapper-${this._currentLookClass}`);
      this.$.eyes.classList.add(this._currentLookClass);
    });
  }


  __startAnimation() {
    this.__animateBlinking();
    this.__animateLooking();

    this.$.eyesPath.addEventListener('animationend',  this.__animateBlinking);
    this.$.eyes.addEventListener(    'transitionend', this.__animateLooking);
  }


  __stopAnimation() {
    this.$.wrapper.classList.remove(`wrapper-${this._currentLookClass}`);
    this.$.eyes.classList.remove(this._currentLookClass);
    this.$.eyesPath.classList.remove('blink');

    this.$.eyesPath.removeEventListener('animationend',  this.__animateBlinking);
    this.$.eyes.removeEventListener(    'transitionend', this.__animateLooking);
  }

}

window.customElements.define(AFSListPlaceholderIcon.is, AFSListPlaceholderIcon);
