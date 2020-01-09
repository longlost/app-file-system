

/**
  * `app-file-system`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
  *
  *
  *   Setup Firebase Storage for downloads:
  *
  *     Must configure CORS for each seperate storage bucket - 
  *
  *       https://firebase.google.com/docs/storage/web/download-files?authuser=0#cors_configuration
  *
  *       The gcloud cli install instructions failed, 
  *       but there is a google cloud console available.
  *       
  *       The web based console has a terminal and file editor built in.
  *       The editor has gcloud and gsutil pre-installed and authenticated.
  *
  *
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  deepClone
}                 from '@longlost/lambda/lambda.js';
import {
  listen,  
  schedule,
  unlisten,
  wait,
  warn
}                 from '@longlost/utils/utils.js';
import {
  EventsMixin
}                 from './events-mixin.js';
import path       from 'path';
import services   from '@longlost/services/services.js';
import htmlString from './app-file-system.html';
import './sources/file-sources.js';
import './lists/preview-lists.js';
// app-modal, app-spinner imports in events-mixin.js.


// From items array/collection back to a Firestore data obj.
const arrayToDbObj = array => {
  return array.reduce((accum, obj) => {
    accum[obj.uid] = obj;
    return accum;
  }, {});
};    


const getImageFileDeletePaths = storagePath => {
  const base = path.basename(storagePath);
  const dir  = path.dirname(storagePath);

  const optimPath = `${dir}/optim_${base}`;
  const thumbPath = `${dir}/thumb_${base}`;

  return [
    storagePath,
    optimPath,
    thumbPath
  ];
};


const deleteStorageFiles = (storagePath, type) => {

  // Test the file type.
  // If its an image, 
  // then delete the optim_ and 
  // thumb_ files from storage as well.
  if (type && type.includes('image')) {
    const paths    = getImageFileDeletePaths(storagePath);
    const promises = paths.map(p => services.deleteFile(p));
    return Promise.all(promises);
  }

  return services.deleteFile(storagePath);
};


class AppFileSystem extends EventsMixin(AppElement) {
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
        value: 'file-list' // Or 'camera-roll'.
      },

      // Positive Int that represents the maximum
      // number of files that can be saved.
      maxfiles: Number,

      // Positive Float that, when multiplied by the
      // 'unit', represent the maximum size of any given file.
      maxsize: Number,

      // One file upload or multiple files.
      multiple: {
        type: Boolean,
        value: false
      },

      // Used as a multipier for 'maxsize'.
      unit: {
        type: String,
        value: 'kB' // or 'B', 'MB', 'GB'
      },

      // Firestore data. Raw document data
      // at field (docData[this.field]).
      _dbData: Object,

      // Drives <preview-lists> repeater.
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
      this._items = Object.values(this._dbData).
                      filter(obj => obj.uid).
                      sort((a, b) => a.index - b.index);
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
    const {
      optimized, 
      original, 
      path: storagePath, 
      type
    } = fileData;

    // An image that has been uploaded but not yet optimized.
    if (type && type.includes('image') && original && !optimized) {
      await this.__waitForCloudProcessing(uid);
    }

    if (storagePath) {

      // Use try catch here to safely delete
      // residual items that have been unsuccessfully
      // or incompletely deleted previously.
      // This sometimes happens with slow connections.
      try {
        await deleteStorageFiles(storagePath, type);
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

    // Adjust <file-items>'s <drag-drop-list> state correction.
    this.$.lists.delete();  

    await this.__deleteDbFileData(uid);

    // Garbage collect file data.
    this.$.sources.delete(uid);

    this.fire('file-deleted', fileData);
  }


  __saveFileData(obj = {}) {
    const data = this._dbData ? 
                   {...this._dbData, ...obj} : // Merge with existing data.
                   obj; // Set new data.

    return services.set({
      coll: this.coll,
      doc:  this.doc,
      data: {
        [this.field]: data
      }
    });
  }

  // Strip out file obj data since it must be uploaded
  // via Firebase storage and is not allowed in Firestore.
  async __addNewFileItems(filesObj) {

    const files     = Object.values(filesObj);
    const lastIndex = this._items ? this._items.length : 0;

    const newItems = files.reduce((accum, file) => {
      const {        
        basename,
        displayName, 
        ext,
        index,
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
        index:    index + lastIndex,
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

  // Add one HTML5 File object or an array of File objects.
  async add(files) {
    try {
      await this.$.spinner.show('Adding files.');

      const array = Array.isArray(files) ? files : [files];   
      this.$.sources.addFiles(array);

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

    try {
      await this.$.spinner.show('Deleting file.');

      this.$.lists.cancelUploads([uid]);

      await this.__delete(uid);
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while trying to delete the file!');
    }
    finally {
      await this.$.spinner.hide();
      return uid;
    }
  }


  async deleteAll() {
    try {
      await this.$.spinner.show('Deleting files.');

      const uids     = Object.keys(this._dbData);
      const promises = uids.map(uid => this.__delete(uid));

      this.$.lists.cancelUploads();

      await Promise.all(promises);
      await services.deleteDocument({
        coll: this.coll,
        doc:  this.doc
      });
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while trying to delete the files!');
    }
    finally {
      return this.$.spinner.hide();
    }
  }


  async deleteMultiple(uids) {
    if (!uids || uids.length === 0) { 
      throw new Error(`<app-file-system> 'deleteMultiple' method must have an array of file uids.`); 
    }

    try {
      await this.$.spinner.show('Deleting files.');

      // const promises = uids.map(uid => this.__delete(uid));

      // this.$.lists.cancelUploads(uids);

      // await Promise.all(promises);


      const promises = uids.map(uid => this.__delete(uid));

      this.$.lists.cancelUploads(uids);

      const iterate = promises => {
        const run = async index => {
          if (index === promises.length) { return; }
          await promises[index]();
          run(index + 1);
        };

        return run(0);
      };

      // One at a time to avoid races with 'services.set()'.
      await iterate(promises);
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while trying to delete these files!');
    }
    finally {
      await this.$.spinner.hide();
      return uids;
    }
  }


  getData() {
    return deepClone(this._dbData);
  }


  openList() {
    return this.$.lists.open();
  }


  openSources() {
    return this.$.sources.open();
  }


  open() {
    return this.openSources();
  }

}

window.customElements.define(AppFileSystem.is, AppFileSystem);
