
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
  listen,
  schedule,
  unlisten
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

      _itemToDelete: Object,

      // Drives <template is="dom-repeat">
      _previewItems: {
        type: Array,
        computed: '__computePreviewItems(items, files)'
      },


      _requestDeleteListenerKey: Object,

      // When deleting an item with drag and drop,
      // this is used to temporary hide that element
      // while the delete confirm modal is open.
      _targetToDelete: Object

    };
  }


  static get observers() {
    return [
      '__listChanged(list)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    // <rearrange-list> and <preview-item>
    this._requestDeleteListenerKey = listen(
      this, 
      'request-delete-item', 
      this.__requestDeleteItem.bind(this)
    );
  }


  disconnectedCallback() {
    unlisten(this._requestDeleteListenerKey);
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


  async __setupForDelete(item, target) {
    this._targetToDelete = target;
    this._itemToDelete   = {...item};

    await schedule();

    this.$.deleteConfirmModal.open();
  }


  __requestDeleteItem(event) {
    hijackEvent(event);

    const {item, target} = event.detail;
    this.__setupForDelete(item, target);
  }

  // <drag-drop> delete area modal.
  async __confirmDeleteButtonClicked(event) {
    try {
      hijackEvent(event);
      await this.clicked();

      const {uid} = this._itemToDelete;

      await this.$.deleteConfirmModal.close();

      this.fire('delete-item', {uid});
    }
    catch (error) {
      if (error === 'click disabled') { return; }
      console.error(error);
    }
    finally {
      this._targetToDelete.style.opacity = '1';
      this._targetToDelete = undefined;
      this._itemToDelete   = undefined;
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


  cancelUploads() {
    if (this.$.rearrangeList.cancelUploads) {
      this.$.rearrangeList.cancelUploads();
    }

    if (this.$.cameraRoll.cancelUploads) {
      this.$.cameraRoll.cancelUploads();
    }
  }


  delete(uid) {
    if (this.$.rearrangeList.delete) {
      this.$.rearrangeList.delete();
    }
  }


  open() {
    return this.$.overlay.open();
  }  

}

window.customElements.define(PreviewList.is, PreviewList);
