

/**
  * `fullscreen-carousel`
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
import htmlString from './fullscreen-carousel.html';
import '@longlost/app-header-overlay/app-header-overlay.js';



class FullscreenCarousel extends AppElement {
  static get is() { return 'fullscreen-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      

    };
  }



  open() {
    return this.$.overlay.open();
  }

}

window.customElements.define(FullscreenCarousel.is, FullscreenCarousel);
