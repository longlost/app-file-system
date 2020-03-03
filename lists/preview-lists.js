
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
  *  
  *    items - Collection of file data objects that drives the template repeater.
  *
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
import htmlString from './preview-lists.html';
import '@longlost/app-overlays/app-modal.js';
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

      files: Object,

      hideDropzone: Boolean,

      list: String

    };
  }


  static get observers() {
    return [
      '__listChanged(list)'
    ];
  }


  __listChanged(list) {
    
    if (list === 'files') {
      import(
        /* webpackChunkName: 'app-file-system-file-list' */ 
        './file-list.js'
      );
    }
    else if (list === 'photos') {
      import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './camera-roll.js'
      );
    }
  }


  cancelDelete() {

    if (this.$.fileList.cancelDelete) {
      this.$.fileList.cancelDelete();
    }
  }


  cancelUploads(uids) {

    if (this.$.fileList.cancelUploads) {
      this.$.fileList.cancelUploads(uids);
    }

    if (this.$.cameraRoll.cancelUploads) {
      this.$.cameraRoll.cancelUploads(uids);
    }
  }


  delete() {    

    if (this.list === 'files') {

      if (this.$.fileList.delete) {
        this.$.fileList.delete();
      }
    }
    else if (this.list === 'photos') {

      if (this.$.cameraRoll.delete) {
        this.$.cameraRoll.delete();
      }
    }
  }


  async open() {

    if (this.list === 'files') {
      await import(
        /* webpackChunkName: 'app-file-system-file-list' */ 
        './file-list.js'
      );

      return this.$.fileList.open();
    }
    else if (this.list === 'photos') {
      await import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './camera-roll.js'
      );
      
      return this.$.cameraRoll.open();
    }

    throw new Error('Cannot open the overlay without the list property being properly set.');
  }


  resetDeleteTarget() {
    
    if (this.$.fileList.resetDeleteTarget) {
      this.$.fileList.resetDeleteTarget();
    }
  }

}

window.customElements.define(PreviewList.is, PreviewList);
