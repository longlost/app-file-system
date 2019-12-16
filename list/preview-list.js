
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
import './rearrange-list.js';


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
      field: {
        type: String,
        value: 'files'
      },

      files: Array,

      hideDropzone: Boolean,

      items: Array,


      // Drives <template is="dom-repeat">
      _previewItems: {
        type: Array,
        computed: '__computePreviewItems(items, files)'
      }

    };
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
    if (!files || files.length === 0) { return items; }

    const previewItems = items.map(item => {
      const match = files.find(obj => {
        const {file} = obj;
        if (!file) { return false; }
        return file.uid === item.uid;
      });

      if (!match || !match.file) {
        // Remove file prop.
        const {file, ...rest} = item; 
        return {...rest};
      }
      // Add file to item.
      return {...item, file: match.file};
    });    

    return previewItems;
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
