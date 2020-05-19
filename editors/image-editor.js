

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

      _opened: Boolean,

      _page: String,

      _pages: {
        type: Array,
        value: [
          'filters',
          'adjust',
          'crop',
          'meta'
        ]
      },

      // Selected tab page.
      _selected: {
        type: String,
        computed: '__computeSelected(_page, _opened)'
      },

    };
  }


  __computeEditedSrc(file) {
    if (!file) { return; }

    return window.URL.createObjectURL(file);
  }


  __computeHideMeta(list) {
    return list === 'files';
  }


  __computeSelected(page, opened) {
    if (!page || !opened) { return; }

    return page;
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

    // Skip initialization.
    if (!this._selected) { return; }

    const page  = event.detail.value;
    const index = this._pages.indexOf(page);

    this.$.carousel.animateToSection(index);
  }


  __carouselIndexChanged(event) {
    const index = event.detail.value;

    this._page = this._pages[index];
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


  async open() {
    await this.$.overlay.open();

    this._opened = true;
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
