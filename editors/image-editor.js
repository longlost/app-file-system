

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
  schedule
}                 from '@longlost/utils/utils.js';
import {
  EditorMixin
}                 from './editor-mixin.js';
import htmlString from './image-editor.html';
import '@longlost/app-spinner/app-spinner.js';
import '@longlost/tab-pages/tab-pages.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import './image-adjuster.js';
import './image-cropper.js';
import './image-filters.js';
import './image-meta.js';
// Map lazy loaded.


class ImageEditor extends EditorMixin(AppElement) {
  static get is() { return 'image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // The selected tab value AFTER tab-pages animation finishes.
      _currentPage: String,

      // ObjectURL string for current low quality, diplayed file.
      _edited: String,

      _editedFile: {
        type: Object,
        observer: '__editedFileChanged'
      },

      _highQuality: {
        type: String,
        computed: '__computeHighQuality(item, _highQualityUrl)'
      },

      _highQualityFile: {
        type: Object,
        observer: '__highQualityFileChanged'
      },

      // ObjectURL string for current high quality file.
      _highQualityUrl: String,

      _hideMeta: {
        type: Boolean,
        value: true,
        computed: '__computeHideMeta(list)'
      },

      _selectedPage: String

    };
  }


  __computeHideMeta(list) {
    return list === 'files';
  }


  __computeHighQuality(item, highQualityUrl) {

    if (highQualityUrl) { return highQualityUrl; }

    if (!item) { return '#'; }

    const {oriented, original, _tempUrl} = item;

    if (oriented) { return oriented; }

    if (original) { return original; }

    return _tempUrl;
  }


  __editedFileChanged(newVal, oldVal) {

    if (oldVal) {
      window.URL.revokeObjectURL(oldVal);
    }

    if (!newVal) { return; }

    this._edited = window.URL.createObjectURL(newVal);
  }


  __highQualityFileChanged(newVal, oldVal) {

    if (oldVal) {
      window.URL.revokeObjectURL(oldVal);
    }

    if (!newVal) { return; }

    this._highQualityUrl = window.URL.createObjectURL(newVal);
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


  __tabPageChanged(event) {
    this._currentPage = event.detail.value;
  }


  async __hideSpinner() {
    await schedule();

    this.$.spinner.hide();
  }


  __showSpinner(event) {
    const {text} = event.detail;
    this.$.spinner.show(text);
  }


  __filtered(event) {
    const {high, low}     = event.detail;
    this._editedFile      = low;
    this._highQualityFile = high;
  }


  __adjusted(event) {
    const {high, low}     = event.detail;
    this._editedFile      = low;
    this._highQualityFile = high;
  }


  __cropped(event) {
    const {high, low}     = event.detail;
    this._editedFile      = low;
    this._highQualityFile = high;
  }


  async open() {
    await this.$.overlay.open();
    await schedule();
    this._lazyItem = this.item;
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
