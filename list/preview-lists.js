
/**
  * `preview-lists`
  * 
  *   Shows file items in a rearrangeable list or photos in a camera-roll.
  *
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *    doc - <String> required: firestore document path to use when saving.
  *           ie. `${program}`, 'home', `${uid}`
  *           default -> undefined
  *
  *
  *    field - <String> optional: firestore document object field (prop) to save the file metadata/info.
  *            ie. 'backgroundImg', 'carousel', 'profileImg'
  *            default -> 'files'
  *
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
  *    'delete-item' - Fired after user confirms a delete action on a single item.
  *                    detail: {uid} 
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
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
import htmlString from './preview-lists.html';
import '@longlost/app-modal/app-modal.js';
import '@polymer/paper-button/paper-button.js';


class PreviewList extends AppElement {
  static get is() { return 'preview-lists'; }

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

      // Displayed name in delete modal.
      _deleteName: {
        type: String,
        computed: '__computeDeleteItemDisplayName(items, _deleteUid)'
      },

      // When deleting an item with drag and drop,
      // or with item delete icon button,
      // his is used to temporary cache the uid
      // while the delete confirm modal is open.
      _deleteUid: String,

      // Drives <template is="dom-repeat">
      _previewItems: {
        type: Array,
        computed: '__computePreviewItems(items, files)'
      },

      _requestDeleteListenerKey: Object

    };
  }


  static get observers() {
    return [
      '__listChanged(list)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    // <file-items> and <file-item>
    this._requestDeleteListenerKey = listen(
      this, 
      'request-delete-item', 
      this.__requestDeleteItem.bind(this)
    );
  }


  disconnectedCallback() {
    super.disconnectedCallback();
    
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


  __computeDeleteItemDisplayName(items, uid) {
    if (!items || !uid) { return; }

    const {displayName} = items.find(item => item.uid === uid);

    return displayName;
  }


  __listChanged(list) {
    
    if (list === 'file-list') {
      import(
        /* webpackChunkName: 'app-file-system-file-list' */ 
        './file-list.js'
      );
    }
    else if (list === 'camera-roll') {
      import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './camera-roll.js'
      );
    }
  }


  async __requestDeleteItem(event) {
    hijackEvent(event);

    this._deleteUid = event.detail.uid;

    await schedule();

    this.$.deleteConfirmModal.open();
  }

  // <drag-drop> delete area modal.
  async __confirmDeleteButtonClicked(event) {
    try {
      hijackEvent(event);
      await this.clicked();

      await this.$.deleteConfirmModal.close();

      if (this.$.fileList.resetDeleteTarget) {
        this.$.fileList.resetDeleteTarget();
      }

      this.fire('delete-item', {uid: this._deleteUid});
    }
    catch (error) {
      if (error === 'click disabled') { return; }
      console.error(error);
    }
  }


  async __dismissDeleteConfirmButtonClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();
      await this.$.deleteConfirmModal.close();

      if (this.$.fileList.cancelDelete) {
        this.$.fileList.cancelDelete();
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  cancelUploads() {

    if (this.$.fileList.cancelUploads) {
      this.$.fileList.cancelUploads();
    }

    if (this.$.cameraRoll.cancelUploads) {
      this.$.cameraRoll.cancelUploads();
    }
  }


  delete() {

    if (this.$.fileList.delete) {
      this.$.fileList.delete();
    }
  }


  open() {

    if (this.list === 'file-list') {
      return this.$.fileList.open();
    }
    else if (this.list === 'camera-roll') {
      return this.$.cameraRoll.open();
    }

    throw new Error('Cannot open the overlay without the list property being properly set.');
  }  

}

window.customElements.define(PreviewList.is, PreviewList);
