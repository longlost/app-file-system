

/**
  * `roll-items`
  * 
  *   Accepts photos and videos from user and handles 
  *   uploading/saving/optimization/deleting/previewing.
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
  *    hideDropzone - <Boolean> optional: undefined -> When true, hide delete dropzone.
  *
  *
  *    items - <Array> required: Input items from Firestore db.
  *
  *
  *                                   
  *
  *  
  *  Methods:
  *
  *
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {scale}    from '@longlost/lambda/lambda.js';
import htmlString from './roll-items.html';
import './roll-item.js';

// args -> inputMin, inputMax, outputMin, outputMax, input.
const thumbnailScaler = scale(0, 100, 72, 148);


class RollItems extends AppElement {
  static get is() { return 'roll-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // From <file-list> tri-state multi select icon button.
      // Select all item checkboxes when true.
      all: Boolean,

      // Firestore coll path string.
      coll: String,

      // Firestore doc path string.
      doc: String,
      
      // Firestore document field to use for saving file data after processing.
      // ie. 'backgroundImg', 'catImages', ...
      field: String,

      // Set to true to hide <file-item> <select-checkbox>'s
      hideCheckboxes: Boolean,

      // Set to true to hide the delete dropzone.
      hideDropzone: Boolean,

      // Input items from db.
      items: Array,

      // From 0 to 100.
      scale: Number

    };
  }


  static get observers() {
    return [
      '__scaleChanged(scale)'
    ];
  }


  __scaleChanged(scale) {
    if (typeof scale !== 'number') { return; }

    const size = thumbnailScaler(scale);

    this.updateStyles({'--thumbnail-size': `${size}px`});
  }


  cancelUploads(uids) {
    const elements = this.selectAll('.roll-item');

    // 'uids' is optional.
    const elsToCancel = uids ? 
      uids.map(uid => elements.find(el => el.item.uid === uid)) : 
      elements;

    elsToCancel.forEach(element => {
      element.cancelUpload();
    });
  }

}

window.customElements.define(RollItems.is, RollItems);
