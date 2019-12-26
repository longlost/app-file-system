

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
  *  Events:
  *
  *
  *    'rearrange-list-sorted' - Fired after <drag-drop-list> items are sorted by user drag action.
  *                              detail -> {sorted} - array of item uid's
  *
  *
  *    'request-delete-item' - Fired when a user drags an item over the delete dropzone.
  *                            detail -> {uid} - item uid
  *                                   
  *
  *  
  *  Methods:
  *
  *
  *    cancelDelete() - User dismisses the delete modal in <preview-list> parent element.
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
  *              
  *
  *    delete() - Removes the highest index found in the _domState correction array.
  *               The reason for removing the highest index is because the <template is="dom-repeat">
  *               element removes the last item in the array of dom elements no matter which item index
  *               is actually removed.
  *
  *    
  *    resetDeleteTarget() - Clears corrective styles applied to an element dragged onto the dropzone, 
  *                          following a dismissed or confirmed delete action.
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


  __putTargetWhereDropped() {
    const {target, x, y} = this._toDelete;

    target.style['transform'] = `translate3d(${x}px, ${y}px, 1px)`;
  }

  // See if item was dropped over the delete area
  // compare pointer coordinates with area position.
  async __handleDrop(event) {
    hijackEvent(event);

    const {data, target}             = event.detail;
    const {x, y}                     = data;
    const {top, right, bottom, left} = this.$.dropZone.getBoundingClientRect();
    const measurements               = {top, right, bottom, left, x, y};

    if (dropIsOverDropZone(measurements)) {

      const uploader                 = target.firstElementChild;
      const {uid}                    = uploader.item;
      const {x: targetX, y: targetY} = target.getBoundingClientRect();

      uploader.pauseUpload();

      // Override transform to keep item over delete zone.
      this._toDelete = {target, uploader, x: targetX, y: targetY};
      this.__putTargetWhereDropped();

      // Show a confirmation modal before deleting.
      this.fire('request-delete-item', {uid});
    }
  }

  // <drag-drop-list> artifact that requires correction
  // so placement does not change.
  __correctForDragDropList() {
    const {target, x, y}     = this._toDelete;
    const {x: newX, y: newY} = target.getBoundingClientRect();

    const xDiff = newX - x;
    const yDiff = newY - y;
    
    target.style['right']  = `${xDiff}px`;      
    target.style['bottom'] = `${yDiff}px`;
  }


  async __handleSort(event) {
    hijackEvent(event);

    if (this._toDelete) {
      this.__putTargetWhereDropped();
      this.__correctForDragDropList();
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


  cancelDelete() {
    if (!this._toDelete) { return; }

    const {uploader} = this._toDelete;

    uploader.resumeUpload();
    this.resetDeleteTarget();
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


  resetDeleteTarget() {
    if (!this._toDelete) { return; }

    const {target} = this._toDelete;

    target.style['transform'] = '';
    target.style['right']     = '0px';
    target.style['bottom']    = '0px';
    this._toDelete            = undefined;
  }

}

window.customElements.define(RearrangeList.is, RearrangeList);
