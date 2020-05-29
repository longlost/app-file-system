

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


import {AppElement, html}           from '@longlost/app-element/app-element.js';
import {listenOnce, schedule, wait} from '@longlost/utils/utils.js';
import {EditorMixin}                from './editor-mixin.js';
import htmlString                   from './image-editor.html';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import './image-editor-icons.js';
import './image-filters.js';
import './image-meta.js';
// tab-pages, image-adjuster, image-cropper and map-overlay lazy loaded.

import '@longlost/tab-pages/tab-pages.js';
import './image-adjuster.js';
import './image-cropper.js';



class ImageEditor extends EditorMixin(AppElement) {
  static get is() { return 'image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // The selected tab value AFTER tab-pages animation finishes.
      _currentPage: {
        type: String,
        value: 'filters'
      },

      // ObjectURL string for current low quality, diplayed file.
      _edited: String,

      _editedFile: {
        type: Object,
        observer: '__editedFileChanged'
      },

      _hideToolbarBtns: {
        type: Boolean,
        value: true,
        computed: '__computeHideToolbarBtns(_edited)'
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

      _opened: {
        type: Boolean,
        value: false
      },

      _selectedPage: {
        type: String,
        value: 'filters'
      },

      // Only used for initialization of paper-tabs
      // once all pages have been lazy-loaded.
      _selectedTab: String

    };
  }


  __computeHideMeta(list) {
    return list === 'files';
  }


  __computeHideToolbarBtns(edited) {
    return !Boolean(edited);
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
  async __back() {

    if (this._edited) {

      await import(
        /* webpackChunkName: 'image-editor-save-modal' */ 
        './image-editor-save-modal.js'
      );

      this.$.saveModal.openUnsaved();
    }
    else {
      this.$.overlay.back();
    }
  }

  // Overlay reset handler.
  __reset() {

    this._opened = false;

    this.fire('resume-carousel');
  }


  async __resetBtnClicked() {
    try {
      await this.clicked();

      await import(
        /* webpackChunkName: 'image-editor-reset-modal' */ 
        './image-editor-reset-modal.js'
      );

      this.$.resetModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; } 
      console.error(error);
    }
  }

  
  async __saveBtnClicked() {
    try {
      await this.clicked();

      await import(
        /* webpackChunkName: 'image-editor-save-modal' */ 
        './image-editor-save-modal.js'
      );

      this.$.saveModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; } 
      console.error(error);
    }
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


  __cleanup() {
    if (this._highQualityUrl) {
      window.URL.revokeObjectURL(this._highQualityUrl);
      this._highQualityUrl  = undefined;
      this._highQualityFile = undefined;
    }

    if (this._edited) {
      window.URL.revokeObjectURL(this._edited);
      this._edited     = undefined;
      this._editedFile = undefined;
    }
  }


  async __resetAll() {

    await this.$.spinner.show('Cleaning up.');  

    this.__cleanup();

    await wait(200);

    await this.$.resetModal.close();

    await wait(800);

    this.$.spinner.hide();
  }

  // Save modal when user chooses to not save edits.
  __close() {
    this.$.overlay.close();
  }


  __save() {
    this.fire('image-editor-save', {value: this._highQualityFile});
  }


  async __saveAndClose() {
    this.__save();

    // Wait for app-file-system spinner entry.
    await wait(300);

    this.$.overlay.reset();
  }


  async open() {

    await this.$.overlay.open();
    await schedule();

    if (!this._selectedTab) {

      // Give filters time to process on initialization.
      await this.$.pagesSpinner.show('Loading.');

      this._opened = true;

      await listenOnce(this, 'image-filters-stamped');

      this._selectedTab = 'filters';

      this.$.pagesSpinner.hide();
    }
    else {
      this._opened = true;
    } 
  }


  saved() {
    this.__cleanup();
  }

}

window.customElements.define(ImageEditor.is, ImageEditor);
