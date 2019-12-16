

/**
  * `image-editor`
  * 
  *   Easily edit images/photos.
  * 	Crop, rotate, brightness, contrast, effects/filters and add rich text.
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
import htmlString from './image-editor.html';
import '@longlost/app-header-overlay/app-header-overlay.js';



class ImageEditor extends AppElement {
  static get is() { return 'image-editor'; }

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

window.customElements.define(ImageEditor.is, ImageEditor);
