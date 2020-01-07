

/**
  * `camera-roll`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  *    items - <Array> required: Input items from Firestore db.
  *
  *
  *
  *  Events:         
  *
  *
  *    'item-clicked' - Fired when an item is clicked.
  *                     detail -> {uid} - item uid
  *
  *  
  *  Methods:
  *
  *
  *
  *    cancelDelete() - User dismisses the delete modal in <preview-list> parent element.
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
  *              
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './camera-roll.html';
import './roll-item.js';


class CameraRoll extends AppElement {
  static get is() { return 'camera-roll'; }

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

      // Input items from db.
      items: Array,



      _toDelete: Object

    };
  }


  cancelDelete() {
    if (!this._toDelete) { return; }

    const {uploader} = this._toDelete;

    uploader.resumeUpload();
  }


  cancelUploads() {
    const elements = this.selectAll('roll-item');
    elements.forEach(element => {
      element.cancelUpload();
    });
  }

}

window.customElements.define(CameraRoll.is, CameraRoll);
