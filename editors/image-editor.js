

/**
  * `image-editor`
  * 
  *   Easily edit images/photos.
  *   Crop, rotate, brightness, contrast, effects/filters and add rich text.
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './image-editor.html';
import '@longlost/app-overlays/app-header-overlay.js';


class ImageEditor extends AppElement {
  static get is() { return 'image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      items: Array

    };
  }

  // Overlay reset handler.
  __reset() {
    this.fire('resume-carousel');
  }


  open() {
    return this.$.overlay.open();
  }

  // Used for confirmed delete actions.
  reset() {
    return this.$.overlay.reset();
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
