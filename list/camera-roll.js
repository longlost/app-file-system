

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
  deepClone,
  removeOne
}                 from '@longlost/lambda/lambda.js';
import {
  hijackEvent,
  listen, 
  message, 
  schedule,
  unlisten,
  wait,
  warn
}                 from '@longlost/utils/utils.js';
import htmlString from './camera-roll.html';
import '@polymer/iron-icon/iron-icon.js';
import './preview-item.js';
import '../shared/file-icons.js';




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

      // Drives <preview-list> repeater.
      items: Array,

      _itemToDelete: Object,

      // When deleting an item with drag and drop,
      // this is used to temporary hide that element
      // while the delete confirm modal is open.
      _targetToDelete: Object

    };
  }


  // static get observers() {
  //   return [
  //     '__collDocFieldChanged(coll, doc, field)'
  //   ];
  // }

  // Start a subscription to file data changes.
  async __collDocFieldChanged(coll, doc, field) {
    if (!coll || !doc || !field) { return; }

    if (this._unsubscribe) {
      this._unsub();
    }
    else { 
      // App is still initializing, 
      // so give <app-settings> time to call enablePersistence
      // on services before calling subscribe.
      await wait(500);
    }

    const callback = docData => {
      this._dbData = docData[field];
      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      const values = Object.values(this._dbData).
                       filter(obj => obj.uid);

      // First save after a local interaction with
      // <drag-drop-list>.
      // Use the snapshot of the current sequence 
      // of items to correct an issue with 
      // using a <template is="dom-repeat"> 
      // inside <drag-drop-list>.
      if (this._orderedUids) {
        this.items = 
          this._orderedUids.
            map(uid => 
              values.find(item => 
                item.uid === uid)).
            filter(item => item);

        this._orderedUids = undefined; // This reset is why this is not a computed method.
      }

      // All other saves/deletes compensated for reused
      // <template is="dom-repeat"> items that are now 
      // ordered differently than simply sorting by item indexes.
      // Saves made by another device after user has reordered items locally.
      else if (
        Array.isArray(this._listOrderState) && 
        this._listOrderState.length > 0
      ) {

        // This is an optimization over doing an array find
        // operation inside the state reduce function.
        // Create an object keyed by item index
        const indexed = values.reduce((accum, val) => {
          accum[val.index] = val;
          return accum;
        }, {});

        // State indexes correlate to the reused <template is="dom-repeat">
        // elements that have been shuffled (translated) around by <drag-drop-list>.
        // So use the incoming data expected order index and correct for
        // the local shuffled, reused element order.
        const found = 
          this._listOrderState.
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
          values.
            sort((a, b) => a.index - b.index).
            slice(found.length);

        this.items = [...found, ...newItems];
      }

      // Fresh data, initial stamp, and no user 
      // interaction with <drag-drop-list>.
      // Simply sort by item index.
      else {
        this.items = values.sort((a, b) => a.index - b.index);
      }
    };

    const errorCallback = error => {
      this._dbData = undefined;
      this.items  = undefined;
      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }
      console.error(error);
    };

    this._unsubscribe = services.subscribe({
      callback,
      coll,
      doc,
      errorCallback
    });
  }


  __handleChanges(event) {
    hijackEvent(event);

    this.fire('list-items-changed', event.detail);
  }


  __handleDrop(event) {
    hijackEvent(event);

    this.fire('list-item-dropped', event.detail);
  }


  __handleSort(event) {
    hijackEvent(event);

    this.fire('list-sort-finished');
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


  __deleteDbFileData(uid) { 
    // Filter out orphaned data that may have been caused
    // by deletions prior to cloud processing completion,
    // and filter out the item to be deleted by uid.
    const values = Object.
                     values(this._dbData).
                     filter(obj => obj.uid && obj.uid !== uid);

    // Cleanup indexes from items deleted from middle of list.
    const ordered = values.
                      sort((a, b) => a.index - b.index).
                      map((item, index) => ({...item, index}));

    // From array back to a data obj.
    const orderedData = arrayToDbObj(ordered);

    // Take out largest index since the <template is="dom-repeat">
    // always removes the last item from the dom.
    // Find the largest index in the state array 
    // and remove it.
    const index = this._listOrderState.findIndex(num => 
                    num === this._listOrderState.length - 1);

    this._listOrderState = removeOne(index, this._listOrderState);

    // Replace entire document entry with
    // item to delete removed (merge: false).
    return services.set({
      coll: this.coll,
      doc:  this.doc,
      data: {
        [this.field]: orderedData
      },
      merge: false
    });
  }


  async __dzFileSaved(event) {
    hijackEvent(event);

    const {uid, original, path} = event.detail;
    // Merge with existing file data.
    const fileData = {...this._dbData[uid], original, path}; 
    await this.__saveFileData({[uid]: fileData});
    this.fire('file-uploaded', fileData);
  }

  // Cache the order in which shuffled (translated by <drag-drop-list>)
  // and reused preview items are ordered, so saves 
  // by other devices can be correcly displayed locally.
  __previewListItemsChanged(event) {
    hijackEvent(event);

    const {items} = event.detail;
    this._listOrderState = items.map(({stateIndex}) => stateIndex);
  }


  __previewListSortFinished(event) {
    hijackEvent(event);

    // Take a snapshot of current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.
    this._orderedUids = this.items.
                           filter(item => item).
                           map(item => item.uid);

    if (this._itemToDelete) {
      this._targetToDelete.style.opacity = '0';
    }



    // // Update index props based on the 
    // // <drag-drop-list> elements order (listItems).
    // const orderedData = addIndexes(data, listItems);


    this.__saveFileData(); // Save new indexes after re-sort.
  }
  
  // From <preview-item> 'X' button when the file
  // has not been fully uploaded.
  async __dzFileRemoved(event) {
    try {
      hijackEvent(event);

      await this.$.spinner.show('Deleting file data.');      
      const {uid} = event.detail;
      // Fire a clone to survive deletion.
      const fileData = {...this._dbData[uid]};

      this.fire('upload-cancelled', fileData);
      await this.__delete(uid);
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while cancelling the upload.');
    }
    finally {
      this.$.spinner.hide();
    }
  }


  __previewListItemClicked(event) {
    hijackEvent(event);

    this.$.dropZone.itemClicked();
  }


  __previewListUploadComplete(event) {
    hijackEvent(event);

    this.$.dropZone.uploadComplete(event.detail);
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


  reset() {
    const elements = this.selectAll('.preview');
    elements.forEach(element => {
      element.cancelUpload();
    });
  }

}

window.customElements.define(CameraRoll.is, CameraRoll);
