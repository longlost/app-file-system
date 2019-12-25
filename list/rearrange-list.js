

/**
  * `rearrange-list`
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
  *    accept - <String> optional: file type to allow from user. 
  *             Any valid HTML5 input accept string or one of 3 
  *             shorthand values: 'image', 'video' or 'audio'.
  *             ie. 'audio', 'video', 'audio,.jpg', '.doc', ... 
  *             default -> 'image'
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
  *    multiple - <Boolean> optional: false -> only accept one file at a time, true -> allow many files at the same time.
  *               default -> false
  *
  *
  *
  *  Events:
  *
  *
  *    'data-changed' - Fired any time file(s) data changes.
  *                     detail -> {[uid]: {coll, doc, ext, field, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}, ...}
  *                                _tempUrl - window.URL.createObjectURL
  *                                index    - used for multiple files ordering
  *
  *
  *    'files-received' - Fired after user interacts with renameFileModal and before the file upload process begins.
  *                       detail -> {name, size, type, uid, <, _tempUrl>}
  *                                   name     - 'filename' (name.ext)
  *                                   _tempUrl - window.URL.createObjectURL
  *
  *  
  *    'file-uploaded' - Fired after successful upload operation.
  *                      detail -> {coll, doc, ext, field, name, original, path, size, sizeStr, type, uid, _tempUrl}
  *                                 original - public download url for full size original
  *
  *
  *    'file-deleted' - Fired after user deletes a file.
  *                     detail -> {coll, doc, ext, field, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}
  *
  *     
  *    'upload-cancelled' - Fired if user cancels the upload process.
  *                         detail -> {coll, doc, ext, field, index, name, path, size, sizeStr, type, uid, _tempUrl}          
  *
  *
  *  
  *  Methods:
  *
  *
  *    add() - Add one File obj or an array of File objects for upload to Firebase Firestore and Storage.
  *
  *
  *    getData() - Returns file data {[uid]: {coll, doc, ext, field, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}, ...}.
  *              
  *
  *    delete(uid) - uid  -> <String> required: file uid to target for delete operation.
  *                            Returns Promise 
  *                            resolves to {coll, doc, ext, field, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}.
  *
  *    
  *    deleteAll() - Returns Promise that resolves when deletion finishes.
  *
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  removeOne
}                 from '@longlost/lambda/lambda.js';
import {
  hijackEvent
}                 from '@longlost/utils/utils.js';
import htmlString from './rearrange-list.html';
import '@longlost/drag-drop-list/drag-drop-list.js';
import '@polymer/iron-icon/iron-icon.js';
import './preview-item.js';
import '../shared/file-icons.js';


const dropIsOverDropZone = ({top, right, bottom, left, x, y}) => {
  if (y < top  || y > bottom) { return false; }
  if (x < left || x > right)  { return false; }
  return true;
};


class RearrangeList extends AppElement {
  static get is() { return 'rearrange-list'; }

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

      // Set to true to hide the delete dropzone.
      hideDropzone: Boolean,

      // Input items from db.
      items: Array,

      // Cached order in which shuffled preview items 
      // are ordered (translated by <drag-drop-list>
      // and reused by <template is="dom-repeat">), so saves 
      // by other devices can be correcly displayed locally.
      _domState: Array,

      // Keep a snapshot of the items proper
      // order in sequence to correct an
      // issue with using <drag-drop-list>
      _previousSort: Array,

      // Drives template repeater.
      _rearrangedItems: Array

    };
  }


  static get observers() {
    return [
      '__itemsChanged(items)',
    ];
  }


  __computeSortableClass(type) {
    if (type && type.includes('video')) {
      return 'video';
    }
    return '';
  }


  __computeHideIcons(items) {
    return !items || items.length < 2;
  }


  __itemsChanged(items) {
    
    if (!items) {
      this._rearrangedItems = undefined;
      return; 
    }

    // First save after a local interaction with
    // <drag-drop-list>.
    // Use the snapshot of the current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.
    if (this._previousSort) {
      this._rearrangedItems = this._previousSort.
                                map(uid => 
                                  items.find(item => 
                                    item.uid === uid)).
                                filter(item => item);

      this._previousSort = undefined; // This reset is why this is not a computed method.
    }
    else if (Array.isArray(this._domState) && this._domState.length > 0) {

      // This is an optimization over doing an array find
      // operation inside the state reduce function.
      // Create an object keyed by item index
      const indexed = items.reduce((accum, val) => {
        accum[val.index] = val;
        return accum;
      }, {});

      // State indexes correlate to the reused <template is="dom-repeat">
      // elements that have been shuffled (translated) around by <drag-drop-list>.
      // So use the incoming data expected order index and correct for
      // the local shuffled, reused element order.
      const found = 
        this._domState.
          reduce((accum, stateIndex, index) => {
            const match = indexed[index];
            if (match) {
              accum[stateIndex] = match;
            }
            return accum; 
          }, []).
          filter(item => item); // Remove any gaps of undefined values.

      // Grab any new items, sort them by index
      // and add them to the end of existing items.
      const newItems = 
        items.
          sort((a, b) => a.index - b.index).
          slice(found.length);

      this._rearrangedItems = [...found, ...newItems];
    }
    else {
      this._rearrangedItems = items;
    }
  }

  // Cache the order in which shuffled (translated by <drag-drop-list>)
  // and reused preview items are ordered, so saves 
  // by other devices can be correcly displayed locally.
  __handleChanges(event) {
    hijackEvent(event);

    const {items}  = event.detail;
    this._domState = items.map(({stateIndex}) => stateIndex);
  }

  // See if item was dropped over the delete area
  // compare pointer coordinates with area position.
  __handleDrop(event) {
    hijackEvent(event);

    const {data, target}             = event.detail;
    const {x, y}                     = data;
    const {top, right, bottom, left} = this.$.dropZone.getBoundingClientRect();
    const measurements               = {top, right, bottom, left, x, y};

    if (dropIsOverDropZone(measurements)) {

      // Show a confirmation modal before deleting.
      const {item}           = target;
      const {height, width}  = target.getBoundingClientRect();
      const xCenter          = x - (width / 2);
      const yCenter          = y - (height / 2);

      // Override transform to keep item over delete zone.
      target.style.transform = `translate3d(${xCenter}px, ${yCenter}px, 1px)`;
      target.pauseUpload();

      this.fire('request-delete-item', {item, target});
    }
  }


  __handleSort(event) {
    hijackEvent(event);

    if (this._itemToDelete) {
      this._targetToDelete.style.opacity = '0';
    }

    // Take a snapshot of current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.
    this._previousSort = this._rearrangedItems.
                           filter(item => item).
                           map(item => item.uid);

    const sorted = this.selectAll('.preview').map(el => el.item.uid);

    this.fire('rearrange-list-sorted', {sorted});
  }


  cancelUploads() {
    const elements = this.selectAll('.preview');
    elements.forEach(element => {
      element.cancelUpload();
    });
  }


  delete() {    
    // Take out largest index since the <template is="dom-repeat">
    // always removes the last item from the dom.
    // Find the largest index in the state array 
    // and remove it.
    const index = this._domState.findIndex(num => 
                    num === this._domState.length - 1);

    this._domState = removeOne(index, this._domState);
  }

}

window.customElements.define(RearrangeList.is, RearrangeList);
