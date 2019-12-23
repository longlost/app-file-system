

/**
  * `app-file-system`
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
import htmlString from './app-file-system.html';
import services   from '@longlost/services/services.js';


// From items array/collection back to a Firestore data obj.
const arrayToDbObj = array => {
  return array.reduce((accum, obj) => {
    accum[obj.uid] = obj;
    return accum;
  }, {});
};    




// TODO:
//      update to use node 'path' module here


const getImageFileDeletePaths = path => {
  const words     = path.split('/');
  const base      = words.slice(0, words.length - 1).join('/');
  const fileName  = words[words.length - 1];
  const optimPath = `${base}/optim_${fileName}`;
  const thumbPath = `${base}/thumb_${fileName}`;

  return [
    path,
    optimPath,
    thumbPath
  ];
};





const deleteStorageFiles = (data, path) => {
  // Lookup the file data item using path and get its type.
  const {type} = 
    Object.values(data).find(obj => 
      obj.path === path);
  // Test the file type.
  // If its an image, 
  // then delete the optim_ and 
  // thumb_ files from storage as well.
  if (type && type.includes('image')) {
    const paths    = getImageFileDeletePaths(path);
    const promises = paths.map(path => services.deleteFile(path));
    return Promise.all(promises);
  }

  return services.deleteFile(path);
};


class AppFileSystem extends AppElement {
  static get is() { return 'app-file-system'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Any valid HTML5 input accept string or
      // one of 3 shorthand values: 'image', 'video' or 'audio'.
      accept: {
        type: String,
        value: 'image'
      },

      // Firestore collection name.
      coll: String,

      // Firestore document name.
      doc: String,

      // Firestore document prop.
      field: {
        type: String,
        value: 'files'
      },

      // Set to true to hide the add and delete dropzones.
      hideDropzone: {
        type: Boolean,
        value: false
      },

      // Controls the type of file preview list to use.
      list: {
        type: String,
        value: 'rearrange-list' // Or 'camera-roll'.
      },

      maxfiles: Number,

      maxsize: Number,

      // One file upload or multiple files.
      multiple: {
        type: Boolean,
        value: false
      },

      unit: {
        type: String,
        value: 'kB' // or 'B', 'MB', 'GB'
      },

      // Firestore data. Raw document data
      // at field (docData[this.field]).
      _dbData: Object,

      // From <file-sources>.
      _files: Array,

      // Drives <preview-list> repeater.
      _items: Array,

      // Services/Firestore subscription unsubscribe function.
      _unsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__collDocFieldChanged(coll, doc, field)',
      '__dbDataChanged(_dbData)'
    ];
  }


  disconnectedCallback() {
    this.__unsub();
  }

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
        this._items = 
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

        this._items = [...found, ...newItems];
      }

      // Fresh data, initial stamp, and no user 
      // interaction with <drag-drop-list>.
      // Simply sort by item index.
      else {
        this._items = values.sort((a, b) => a.index - b.index);
      }
    };

    const errorCallback = error => {
      this._dbData = undefined;
      this._items  = undefined;
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


  __unsub() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }


  __dbDataChanged(data) {
    this.fire('data-changed', data);
  }

  // Listen for data changes.
  // Resolve the promise when the 
  // file item has an optimized prop.
  __waitForCloudProcessing(uid) {
    return new Promise(resolve => {
      listen(this, 'data-changed', (event, key) => { // Local event.
        const {optimized} = event.detail[uid];
        if (optimized) { // Only present after processing.
          unlisten(key);
          resolve();
        }
      });
    });    
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


  async __delete(uid) {
    // Clone to survive deletion and fire with event.
    const fileData = {...this._dbData[uid]}; 
    const {optimized, original, path, type} = fileData;
    // An image that has been uploaded but not yet optimized.
    if (type && type.includes('image') && original && !optimized) {
      await this.__waitForCloudProcessing(uid);
    }
    if (path) {
      // Use try catch here to safely delete
      // residual items that have been unsuccessfully
      // or incompletely deleted previously.
      // This sometimes happens with slow connections.
      try {
        await deleteStorageFiles(this._dbData, path);
      }
      catch (error) {
        if (error.message && error.message.includes('does not exist')) {
          console.warn(`Storage Object already deleted. 
            Continuing with Firestore data delete.`);
        } 
        else {
          throw error;
        }
      }
    }
    await this.__deleteDbFileData(uid);
    this.fire('file-deleted', fileData);
  }


  __saveFileData(obj = {}) {
    const data = this._dbData ? 
                   {...this._dbData, ...obj} : // Merge with existing data.
                   obj; // Set new data.


    // <preview-list>'s <drag-drop-list> elements.
    const listItems = this.$.list.getListItems();


    // // Update index props based on the 
    // // <drag-drop-list> elements order (listItems).
    // const orderedData = addIndexes(data, listItems);




    return services.set({
      coll: this.coll,
      doc:  this.doc,
      data: {
        [this.field]: orderedData
      }
    });
  }


  async __addNewFileItems(files) {
    const newItems = files.reduce((accum, file) => {
      const {        
        basename,
        displayName, 
        ext,
        orientation,
        size,  
        sizeStr,
        timestamp,
        type,
        uid,
        _tempUrl
      } = file;

      accum[uid] = {
        basename,
        coll:     this.coll,
        displayName,
        doc:      this.doc,
        ext,
        field:    this.field,
        orientation,
        size, 
        sizeStr,
        timestamp,
        type,
        uid,
        _tempUrl
      };

      return accum;
    }, {});

    this.$.dropZone.addFiles(files);
    this.fire('files-received', {files});

    if (!this.multiple) {
      // Delete previous file and its data.
      if (this._items && this._items.length) {
        const {uid} = this._items[this._items.length - 1];
        await this.__delete(uid);        
      }
    }

    return this.__saveFileData(newItems);
  }


  __sourcesFilesChanged(event) {
    hijackEvent(event);

    this._files = event.detail.value;
  }


  async __dzFileSaved(event) {
    hijackEvent(event);

    const {uid, original, path} = event.detail;
    // Merge with existing file data.
    const fileData = {...this._dbData[uid], original, path}; 
    await this.__saveFileData({[uid]: fileData});
    this.fire('file-uploaded', fileData);
  }


  __previewListItemsChanged() {

  }


  __previewListSortFinished(event) {
    hijackEvent(event);

    // Take a snapshot of current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.
    this._orderedUids = this._items.
                           filter(item => item).
                           map(item => item.uid);

    if (this._itemToDelete) {
      this._targetToDelete.style.opacity = '0';
    }
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


  async __openEditor() {
    await import('./editor/image-editor.js');
    this.$.editor.open();
  }

  // Add one File obj or an array of File objects.
  async add(files) {
    try {
      await this.$.spinner.show('Adding files.');

      const array = Array.isArray(files) ? files : [files];

      const filesWithIdsAndOrientation = await addUidAndOrientation(array);      
      this.$.dropZone.addFiles(filesWithIdsAndOrientation);
      await schedule();
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while adding files.');
    }
    finally {
      return this.$.spinner.hide();
    }
  }


  async delete(uid) {
    if (!uid) { 
      throw new Error(`<app-file-system> 'delete' method must have a uid argument present.`); 
    }
    // Clone to survive deletion.
    const fileData = {...this._dbData[uid]};

    try {
      await this.$.spinner.show('Deleting file data.');
      await this.__delete(uid);
    }
    catch (error) {
      console.error(error);
      await warn('Sorry, an error occured while trying to delete the file!');
    }
    finally {
      await this.$.spinner.hide();
      return fileData;
    }
  }


  async deleteAll() {
    try {
      await this.$.spinner.show('Deleting file data.');
      const uids     = Object.keys(this._dbData);
      const promises = uids.map(uid => this.__delete(uid));
      this.$.list.reset();
      await Promise.all(promises);
      await services.deleteDocument({
        coll: this.coll,
        doc:  this.doc
      });
      this.$.dropZone.reset();
    }
    catch (error) {
      console.error(error);
      await warn('Sorry, an error occured while trying to delete the files!');
    }
    finally {
      return this.$.spinner.hide();
    }
  }


  getData() {
    return deepClone(this._dbData);
  }


  async openList() {
    await import ('./list/preview-list.js');
    return this.$.list.open();
  }


  async openSources() {
    await import ('./sources/file-sources.js');
    return this.$.sources.open();
  }


  open() {
    return this.openSources();
  }

}

window.customElements.define(AppFileSystem.is, AppFileSystem);
