

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
import '@longlost/tab-pages/tab-pages.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import './image-adjuster.js';
import './image-cropper.js';
import './image-filters.js';
// Map lazy loaded.


class ImageEditor extends EditorMixin(AppElement) {
  static get is() { return 'image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _editedFile: Object,

      _editedSrc: {
        type: String,
        computed: '__computeEditedSrc(_editedFile)'
      },

      _hideMeta: {
        type: Boolean,
        value: true,
        computed: '__computeHideMeta(list)'
      },

      _selectedPage: String

    };
  }


  __computeEditedSrc(file) {
    if (!file) { return; }

    return window.URL.createObjectURL(file);
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
    this._opened = false;
    this.fire('resume-carousel');
  }

  // Paper tabs on-selected-changed handler.
  __selectedPageChanged(event) {
    this._selectedPage = event.detail.value;
  }


  __adjusted(event) {
    this._editedFile = event.detail.value;
  }


  __cropped(event) {
    this._editedFile = event.detail.value;
  }


  __filtered(event) {
    this._editedFile = event.detail.value;
  }


  open() {
    return this.$.overlay.open();
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
