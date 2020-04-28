

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
import {
  EditorMixin
}                 from './editor-mixin.js';
import htmlString from './image-editor.html';
import '@longlost/app-carousel/app-carousel.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
// Map lazy loaded.


class ImageEditor extends EditorMixin(AppElement) {
  static get is() { return 'image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _hideMeta: {
        type: Boolean,
        value: true,
        computed: '__computeHideMeta(list)'
      }

    };
  }


  __computeHideMeta(list) {
    return list === 'files';
  }

  // Overlay back button event handler.
  __back() {


    // TODO:
    //      intercept this event if there are pending changes
    //      to show a modal to user
    

    this.$.overlay.back();
  }

  // Overlay reset handler.
  __reset() {
    this.fire('resume-carousel');
  }

  // Paper tabs on-selected-changed handler.
  __selectedChanged(event) {
    const {value} = event.detail;

    if (typeof value !== 'number') { return; }

    this.$.carousel.animateToSection(value);
  }


  open() {
    return this.$.overlay.open();
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
