
/**
  * `preview-list`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  *
  *  Properites:
  *
  *  
  *    items - Collection of file data objects that drives the template repeater.
  *
  *  
  *
  *
  *  Events:
  *
  *
  *    'list-item-dropped' - Fired any time an item is dropped.
  *                            detail: {data (x, y coordinates), target} 
  *
  *    'list-sort-finished' - Fired any time the list is sorted.
  *
  *
  *
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  hijackEvent,
  isDisplayed, 
  listen
}                 from '@longlost/utils/utils.js';
import htmlString from './preview-list.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@longlost/app-modal/app-modal.js';
import '@polymer/paper-button/paper-button.js';


class PreviewList extends AppElement {
  static get is() { return 'preview-list'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Firestore coll path string.
      coll: String,

      // Firestore doc path string.
      doc: String,
      
      // Firestore document field to use for saving file data after processing.
      // ie. 'backgroundImg', 'catImages', ...
      field: String,

      files: Object,

      hideDropzone: Boolean,

      items: Array,

      list: String,

      // Drives <template is="dom-repeat">
      _previewItems: {
        type: Array,
        computed: '__computePreviewItems(items, files)'
      }

    };
  }


  static get observers() {
    return [
      '__listChanged(list)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    listen(this, 'upload-complete', this.__fileUploadComplete.bind(this));
    listen(this, 'remove-file',     this.__removeFile.bind(this));
  }

  // Combine incomming file obj with db item.
  // File obj is fed to <upload-controls>.
  __computePreviewItems(items, files) {
    if (!items || items.length === 0) { return; }
    if (!files || Object.keys(files).length === 0) { return items; }

    const previewItems = items.map(item => {

      const match = files[item.uid];

      if (!match) {
        // Remove file prop.
        const {file, ...rest} = item; 
        return {...rest};
      }
      // Add file to item.
      return {...item, file: match};
    });    

    return previewItems;
  }


  __listChanged(list) {
    if (list === 'rearrange-list') {
      import(
        /* webpackChunkName: 'app-file-system-rearrange-list' */ 
        './rearrange-list.js'
      );
    }
    else if (list === 'camera-roll') {
      import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './camera-roll.js'
      );
    }
  }


  async __itemClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();
      this.fire('list-item-clicked');
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }

  // Event handler from <upload-controls>.
  __fileUploadComplete(event) {
    hijackEvent(event);

    this.fire('list-upload-complete', event.detail);
  }

  // <upload-controls> ui 'X' button clicked.
  __removeFile(event) {
    hijackEvent(event);
    
    this.fire('list-remove-file', event.detail);
  }


  async __setupForDelete(item, target) {
    this._targetToDelete = target;
    this._itemToDelete   = {...item};
    await schedule();
    this.$.deleteConfirmModal.open();
  }


  __previewListRemoveFile(event) {
    hijackEvent(event);

    const {item, target} = event.detail;
    this.__setupForDelete(item, target);
  }

  // <drag-drop> delete area modal.
  async __confirmDeleteButtonClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();
      await this.$.spinner.show('Deleting file data.');
      const files = this.$.dropZone.getFiles();
      const {uid} = this._itemToDelete;
      const fileToDelete = files.find(file => 
                             file.uid === uid);
      
      if (fileToDelete) { // Cancel upload and remove file from dropzone list.
        this.$.dropZone.removeFile(fileToDelete);
      }

      await this.$.deleteConfirmModal.close(); 
      await this.__delete(uid);
    }
    catch (error) {
      if (error === 'click disabled') { return; }
      console.error(error);
    }
    finally {
      this._targetToDelete.style.opacity = '1';
      this._targetToDelete = undefined;
      this._itemToDelete   = undefined;
      this.$.spinner.hide();
    }
  }


  async __dismissDeleteConfirmButtonClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();
      this._targetToDelete.style.opacity = '1';
      this._itemToDelete                 = undefined;
      this._targetToDelete.resumeUpload();
      this.$.deleteConfirmModal.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // Used to update indexes.
  // Returns an array that is ordered exactly
  // as represented in the ui.
  getListItems() {
    return this.selectAll('.preview').
             filter(el => isDisplayed(el)).
             map(el => el.item);
  }


  open() {
    return this.$.overlay.open();
  }


  reset() {
    const elements = this.selectAll('.preview');
    elements.forEach(element => {
      element.cancelUpload();
    });
  }

}

window.customElements.define(PreviewList.is, PreviewList);
