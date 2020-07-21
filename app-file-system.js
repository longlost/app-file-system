

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
  *   Add this to the project's package.json for a smaller, custom 'exifreader' build.
  *
  *     "exifreader": {
  *       "include": {
  *         "exif": [
  *           "DateTimeOriginal",   
  *           "GPSAltitude",        
  *           "GPSAltitudeRef",     
  *           "GPSDateStamp",       
  *           "GPSImgDirection",    
  *           "GPSImgDirectionRef", 
  *           "GPSLatitude",        
  *           "GPSLatitudeRef",     
  *           "GPSLongitude",       
  *           "GPSLongitudeRef",    
  *           "GPSTimeStamp",       
  *           "ImageDescription",   
  *           "Orientation"
  *         ]
  *       }
  *     },
  *
  *
  *  'File item': {basename, coll, doc, ext, index, name, path, size, sizeStr, timestamp, type, uid <, _tempUrl, optimized, original, thumbnail>}
  *                 _tempUrl - window.URL.createObjectURL, do not use
  *                 index    - used for multiple files ordering
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
  *           ie. `cms/ui/programs`, 'images', `users/${user.uid}/photos`
  *           default -> undefined
  *
  * 
  *    list - <String> required: 'files' or 'photos'. Defaults to 'files'.
  *           Controls the type of file preview list to use.
  *
  *           Choose 'files' for a general file picker and editor
  *           that handles many different types of files. 
  *           The picker allows the user to rearrange the order in
  *           which the files appear with a drag and drop interface.
  *           The file 'index' property is used to order the elements
  *           which makes it a good fit for use with carousels or 
  *           layouts where the order can be arbitrary and not based 
  *           on when the file was saved.
  *
  *           Choose 'photos' for image and video files only. 
  *           Typically useful for photos captured on device where 
  *           the photos should be ordered by timestamp or 
  *           geolocation contexts.
  *           The user cannot rearrange these files.
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
  *    'app-file-system-data-changed' - Fired any time file(s) data changes.
  *                                     detail -> {[uid]: 'File item', ...}
  *
  *
  *
  *    'app-file-system-items-deleted' - Fired after user deletes one or more file items.
  *                                      detail -> {uids}
  *
  *
  *  
  *  Methods:
  *
  *
  *    add() - Add one File obj or an array of File objects for upload to Firebase Firestore and Storage.
  *
  *
  *    getData() - Returns file data {[uid]: {coll, doc, ext, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}, ...}.
  *              
  *
  *    delete(uid) - uid  -> <String> required: file uid to target for delete operation.
  *                            Returns Promise 
  *                            resolves to {coll, doc, ext, index, name, path, size, sizeStr, type, uid, _tempUrl <, optimized, original, thumbnail>}.
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
} from '@longlost/app-element/app-element.js';

import {deepClone} from '@longlost/lambda/lambda.js';

import {
  hijackEvent,
  listen,  
  schedule,
  unlisten,
  wait,
  warn
} from '@longlost/utils/utils.js';

import {EventsMixin} from './events-mixin.js';

import {
  allProcessingRan,
  isCloudProcessable
} from './shared/utils.js';

import path       from 'path';
import services   from '@longlost/services/services.js';
import htmlString from './app-file-system.html';
import './sources/file-sources.js';
// Modals, app-spinner imports in events-mixin.js.


const getImageFileDeletePaths = (storagePath, type) => {

  // Replace video file ext with .jpeg for all poster images.
  const base = type.includes('video') ? 
    `${path.basename(storagePath, path.extname(storagePath))}.jpeg` : 
    path.basename(storagePath);

  const dir = path.dirname(storagePath);

  const optimPath  = `${dir}/optim_${base}`;
  const orientPath = `${dir}/orient_${base}`;
  const thumbPath  = `${dir}/thumb_${base}`;

  return [
    storagePath,
    optimPath,
    orientPath,
    thumbPath
  ];
};


// Fails gracefully.
const deleteStorageFiles = async item => {

  // Use try catches here to safely delete
  // residual items that have been unsuccessfully
  // or incompletely deleted previously.
  // This sometimes happens with slow connections.
  try {

    const {sharePath, path: storagePath, type} = item;

    if (storagePath) {

      // Test the file type.
      // If its an image/video, 
      // then delete the orient_, optim_ and 
      // thumb_ files from storage as well.
      if (isCloudProcessable(item)) {
        const paths    = getImageFileDeletePaths(storagePath, type);
        const promises = paths.map(p => services.deleteFile(p));

        // 'await' here to catch errors and fail gracefully.
        await Promise.all(promises);
        return;
      }

      if (sharePath) {
        await Promise.all([
          services.deleteFile(sharePath),
          services.deleteFile(storagePath)
        ]);
        return;
      }

      await services.deleteFile(storagePath);
    }
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

      // Passed into <map-overlay> and <app-map>
      darkMode: Boolean,

      // Set to true to hide the 'device-file-card' dropzone.
      hideDropzone: {
        type: Boolean,
        value: false
      },

      // Controls the type of file preview list to use.
      //
      // Choose 'files' for a general file picker and editor
      // that handles many different types of files. 
      // The picker allows the user to rearrange the order in
      // which the files appear with a drag and drop interface.
      // The file 'index' property is used to order the elements
      // which makes it a good fit for use with carousels or 
      // layouts where the order can be arbitrary and not based 
      // on when the file was saved.
      //
      // Choose 'photos' for image and video files only. 
      // Typically useful for photos captured on device where 
      // the photos should be ordered by timestamp or 
      // geolocation contexts.
      // The user cannot rearrange these files.
      list: {
        type: String,
        value: 'files' // Or 'photos'.
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

      // From file-soureces.
      // Upload controls, progress and state.
      // Consumed by upload-controls ui.
      _uploads: {
        type: Object,
        value: () => ({})
      }

    };
  }


  static get observers() {
    return [
      '__dbDataChanged(_dbData)', // _dbData prop def in events-mixin.js.
      '__listChanged(list)'
    ];
  }


  __dbDataChanged(data) {

    this.fire('app-file-system-data-changed', {data});
  }


  __listChanged(list) {
    
    if (list === 'files') {
      import(
        /* webpackChunkName: 'app-file-system-file-list' */ 
        './lists/file-list.js'
      );
    }
    else if (list === 'photos') {
      import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './lists/camera-roll.js'
      );
    }
  }


  __cancelUploads(uids) {

    uids.forEach(uid => {
      if (this._uploads[uid]) {
        this._uploads[uid].controls.cancel();
      }
    });
  }

  // Listen for data changes.
  // Resolve the promise when the 
  // file item has fully processed.
  __waitForCloudProcessing(item) {
    const {original, uid} = item;    

    // An image or video that has been uploaded but not yet processed.
    if (isCloudProcessable(item) && original && !allProcessingRan(item)) {

      return new Promise(resolve => {

        listen(this, 'app-file-system-data-changed', (event, key) => { // Local event.
          const match = event.detail.data[uid];

          if (allProcessingRan(match)) { // Only present after processing.
            unlisten(key);
            resolve();
          }
        });
      });    
    }

    return Promise.resolve();
  }

  // Adjust <file-items>'s <drag-drop-list> state correction.
  // Reset multiselect-btns.
  __deleteFromList() {    

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


  async __delete(uids) {

    this.__cancelUploads(uids);

    // Clone to survive deletion and fire with event.
    const items = uids.map(uid => this._dbData[uid]);

    // Make sure these two operations run synchronously
    // for each item, but allow parallel at the items level.
    const deleteFromStorage = async item => {

      // An image that has been uploaded but not yet optimized.
      await this.__waitForCloudProcessing(item);

      // Fails gracefully.
      return deleteStorageFiles(item);
    };

    const storagePromises = items.map(item => deleteFromStorage(item));

    await Promise.all(storagePromises);

    // Adjust <file-items>'s <drag-drop-list> state correction.
    // Reset multiselect-btns.
    uids.forEach(() => {
      this.__deleteFromList();  
    });

    // Gather items left over from delete.
    // These are used to collapse indexes.
    const remaining = uids.reduce((accum, uid) => {
      delete accum[uid];
      return accum;
    }, {...this._dbData});


    const itemsToDelete = uids.map(uid => ({coll: this.coll, doc: uid}));

    await services.deleteItems(itemsToDelete);

    // Take remaining items, 
    // sort ascending by index, 
    // issue new indexes.
    const collapsed = Object.values(remaining).
                        sort((a, b) => a.index - b.index).
                        map((item, index) => {
                          if (item.index !== index) { // Only changes need to be saved.
                            return {
                              coll: this.coll, 
                              doc:  item.uid, 
                              data: {index}
                            };
                          }
                        }).
                        filter(obj => obj);

    await services.saveItems(collapsed);

    this.fire('app-file-system-items-deleted', {uids});
  }

  // From file-sources.
  // Previous file(s) are replaced when 
  // 'multiple' is falsey. 
  // Only one file at a time.
  __deletePrevious(event) {
    this.__delete(event.detail.uids);
  }

  // From file-sources.
  // Upload successful, canceled or failed.
  __uploadDone(event) {
    hijackEvent(event);

    const {uid} = event.detail;

    this.set(`_uploads.${uid}`, null);
    delete this._uploads[uid]; 
  }

  // From file-sources.
  // Upload controls, state or progress updates.
  __uploadUpdated(event) {
    hijackEvent(event);

    const {upload} = event.detail;

    if (this._uploads[upload.uid]) {
      const {progress, state, uid} = upload;

      this.set(`_uploads.${uid}.progress`, progress);    
      this.set(`_uploads.${uid}.state`,    state);
    }
    else {
      this.set(`_uploads.${upload.uid}`, upload);
    }
  }

  // Add one HTML5 File object or an array of File objects.
  async add(files) {
    try {

      if (this.list === 'files') {

        const str = Array.isArray(files) ? 'files' : 'file';

        await this.$.spinner.show(`Saving ${str}.`);
      }
      else {

        const str = Array.isArray(files) ? 'photos' : 'photo';

        await this.$.spinner.show(`Saving ${str}.`);
      }

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

      await this.__delete([uid]);
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

      const uids = Object.keys(this._dbData);

      await this.__delete(uids);
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

      await this.__delete(uids);
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


  async openList() {
    
    if (this.list === 'files') {
      await import(
        /* webpackChunkName: 'app-file-system-file-list' */ 
        './lists/file-list.js'
      );

      return this.$.fileList.open();
    }
    else if (this.list === 'photos') {
      await import(
        /* webpackChunkName: 'app-file-system-camera-roll' */ 
        './lists/camera-roll.js'
      );
      
      return this.$.cameraRoll.open();
    }

    throw new Error('Cannot open the overlay without the list property being properly set.');
  }


  openSources() {
    return this.$.sources.open();
  }


  open() {
    return this.openSources();
  }

}

window.customElements.define(AppFileSystem.is, AppFileSystem);
