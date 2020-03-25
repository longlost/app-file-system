

/**
  * `photo-carousel`
  * 
  *   Fullscreen image/photo/video viewer carousel.
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
  *    open()
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {wait}     from '@longlost/utils/utils.js';
import htmlString from './photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@polymer/iron-image/iron-image.js';
import '../shared/action-buttons.js';


class PhotoCarousel extends AppElement {
  static get is() { return 'photo-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Used for entry animation and inital setup.
      item: Object,

      _currentItem: Object,

      _items: Array,

      _src: {
        type: String,
        computed: '__computeSrc(item)'
      }

    };
  }


  connectedCallback() {
    super.connectedCallback();

    const customEase = 'cubic-bezier(0.49, 0.01, 0, 1)';

    this._overlayAnimations = {
      open: {
        name:    'fade-in', 
        nodes:   this.$.overlay, 
        options: {duration: 550, easing: 'ease-out'}
      },
      back: [{
        name:    'slide-up', 
        nodes:   this.$.overlay, 
        options: {duration: 550, easing: customEase}
      }, {
        name:    'fade-out', 
        nodes:   this.$.overlay, 
        options: {duration: 500, easing: 'ease-in'}
      }],
      close: [{
        name:    'slide-up', 
        nodes:   this.$.overlay, 
        options: {duration: 550, easing: customEase}
      }, {
        name:    'fade-out', 
        nodes:   this.$.overlay, 
        options: {duration: 500, easing: 'ease-in'}
      }]
    };
  }


  __computeSrc(item) {
    if (!item) { return '#'; }

    const {optimized, original} = item;

    return optimized ? optimized : original;
  }


  async open(measurements) {

    this._measurements = measurements;

    await this.$.flip.play();

    await import('@longlost/app-overlays/app-header-overlay.js');

    await this.$.overlay.open();

    // Prevents a flicker.
    await wait(500);

    this.$.flip.reset();
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);
