

/**
  * `fullscreen-gallery`
  * 
  *   Fullscreen image viewer carousel.
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
import htmlString from './fullscreen-gallery.html';
import '@longlost/app-header-overlay/app-header-overlay.js';



class FullscreenGallery extends AppElement {
  static get is() { return 'fullscreen-gallery'; }

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

window.customElements.define(FullscreenGallery.is, FullscreenGallery);
