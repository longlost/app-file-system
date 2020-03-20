

/**
  * `photo-carousel`
  * 
  *   Fullscreen image/photo/video viewer carousel.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './photo-carousel.html';
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

      _items: Array

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



  async open(measurements) {

    // TODO:
    //      run an expand animation using the item and measurements

    await import('@longlost/app-overlays/app-header-overlay.js');

    return this.$.overlay.open();
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);
