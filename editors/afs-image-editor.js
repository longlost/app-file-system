

/**
  * `afs-image-editor`
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
import htmlString                   from './afs-image-editor.html';
import '@longlost/app-spinner/app-spinner.js';
import '@longlost/tab-pages/tab-pages.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import './afs-image-adjuster.js';
import './afs-image-cropper.js';
import './afs-image-editor-icons.js';
import './afs-image-filters.js';
import './afs-image-meta.js';
// map-overlay lazy loaded.


class AFSImageEditor extends EditorMixin(AppElement) {
  static get is() { return 'afs-image-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: {
        type: Object,
        observer: '__itemChanged'
      },

      _cropIsRound: Boolean,

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

      _ext: {
        type: String,
        computed: '__computeExt(item.type, item.ext, _cropIsRound)'
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

  // Use the incoming item's ext or switch
  // to png if the image is cropped elliptically.
  // Must manually set this since temporary files
  // created after each applied edit do not carry
  // this information in the url returned by
  // window.URL.createObjectURL.
  // If this is not handled, the output file will 
  // automatically be set to image/png and the
  // file size will thus explode by 5x.
  // This should be avoided for perfromance reasons
  // as well as errors that occur when uploading
  // and cloud processing images larger than 10MB.
  __computeExt(type, ext, cropIsRound) {
    if (!type || !ext) { return; }

    // If this is a video, use the poster's extension, 
    // not the video file's. All video posters are .jpeg.
    const extension = type.includes('video') ? '.jpeg' : ext;

    return cropIsRound ? '.png' : extension;
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

    const {_tempUrl, original, poster, type} = item;

    if (poster) { return poster; }

    // Cannot use 'original' or '_tempUrl' for videos as that 
    // is the actual raw video, not an editable still poster.
    if (type.includes('video')) { return '#'; }

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


  async __showPageSpinner() {
    if (!this._selectedPage) { return; }

    this.$.pagesSpinner.show('Loading.');

    if (this._selectedPage === 'filters') {
      await listenOnce(this, 'image-filters-loaded');
    }

    if (this._selectedPage === 'adjust') {
      await listenOnce(this, 'image-adjuster-loaded');
    }

    if (this._selectedPage === 'crop') {
      await listenOnce(this, 'image-cropper-loaded');
    }

    this.$.pagesSpinner.hide();
  }

  // Garbage collect if the image item has changed, 
  // otherwise, keep previous edits in tact.
  __itemChanged(newVal, oldVal) {

    if (!newVal || !oldVal) { return; }

    // A different image was selected to open editor.
    if (newVal.uid !== oldVal.uid) {
      this.__cleanup();

      this.__showPageSpinner();
    }
  }

  // Overlay back button event handler.
  async __back() {

    if (this._edited) {

      await import(
        /* webpackChunkName: 'afs-image-editor-save-modal' */ 
        './afs-image-editor-save-modal.js'
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
        /* webpackChunkName: 'afs-image-editor-reset-modal' */ 
        './afs-image-editor-reset-modal.js'
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
        /* webpackChunkName: 'afs-image-editor-save-modal' */ 
        './afs-image-editor-save-modal.js'
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


  __cropRoundChanged(event) {
    this._cropIsRound = event.detail.value;
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


  async __save() {

    this.__showPageSpinner();

    await schedule();

    this.fire('image-editor-save', {value: this._highQualityFile});
  }


  async __saveAndClose() {
    await this.__save();

    // Wait for app-file-system spinner entry.
    await wait(500);

    this.$.overlay.reset();
  }
  

  async open() {

    await this.$.overlay.open();
    await schedule();

    // Give filters time to process on initialization.
    await this.$.pagesSpinner.show('Loading.');

    this._opened = true;

    await listenOnce(this, 'image-filters-stamped');

    if (!this._selectedTab) {
      this._selectedTab = 'filters';
    }  

    await schedule();

    this.$.pagesSpinner.hide();
  }


  saved() {
    this.__cleanup();
  }

}

window.customElements.define(AFSImageEditor.is, AFSImageEditor);
