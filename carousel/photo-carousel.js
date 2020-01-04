

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
import '@longlost/app-header-overlay/app-header-overlay.js';



class PhotoCarousel extends AppElement {
  static get is() { return 'photo-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      

    };
  }



  open(photo) {
    const {item, measurements} = photo;

    // TODO:
    //      run an expand animation using the item and measurements


    return this.$.overlay.open();
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);