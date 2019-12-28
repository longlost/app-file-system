
/**
  * `file-list`
  * 
  *   Shows file items in a rearrangeable list.
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
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './file-list.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/file-icons.js';
import './file-items.js';


class FileList extends AppElement {
  static get is() { return 'file-list'; }

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

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true
      },

      hideDropzone: Boolean,

      // Drives <template is="dom-repeat">
      items: Array

    };
  }


  async __deleteBtnClicked() {
    try {
      await this.clicked();

      this.fire('file-list-delete-items');


      console.log('delete btn');


    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __downloadBtnClicked() {
    try {
      await this.clicked();

      this.fire('file-list-download-items');
      

      console.log('download btn');


    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __printBtnClicked() {
    try {
      await this.clicked();

      this.fire('file-list-print-items');
      

      console.log('print btn');


    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __selectBtnActiveChanged(event) {
    const {value} = event.detail;

    this._hideCheckboxes = !value;
  }


  cancelDelete() {
    this.$.fileItems.cancelDelete();
  }


  cancelUploads() {
    this.$.fileItems.cancelUploads();
  }


  delete() {
    this.$.fileItems.delete();
  }


  open() {
    return this.$.overlay.open();
  }


  resetDeleteTarget() {
    this.$.fileItems.resetDeleteTarget();
  }

}

window.customElements.define(FileList.is, FileList);
