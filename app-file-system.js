

/**
  * `app-file-system`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
  *
  *
  *   Stacking Context:
  *
  *     This element should be in a higher stack context than the rest 
  *     of the app elements so the `file-sources-save-as-modal` can be 
  *     reached during other workflows where afs is running in the 
  *     background. 
  * 
  *     Only mission critical elements should be placed above, and 
  *     allowed to overlay this element.
  *
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
  *   Build Config:
  *
  *     Add this to the project's package.json for a smaller, custom 'exifreader' build.
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
  *    'app-file-system-items-saved' - Fired any time file(s) items are saved to db.
  *                                     detail -> {[uid]: 'File item', ...}
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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent, 
  listenOnce,
  schedule
} from '@longlost/app-core/utils.js';

import template from './app-file-system.html';


class AppFileSystem extends AppElement {

  static get is() { return 'app-file-system'; }

  static get template() {
    return template;
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

      // Controls gradient styling used by several afs elements.
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

      // If set, afs will not ask the user to confirm
      // uploading files after processing.
      noUploadConfirm: Boolean,

      // Used as a multipier for 'maxsize'.
      unit: {
        type: String,
        value: 'kB' // or 'B', 'MB', 'GB'
      },

      _active: {
        type: Boolean,
        computed: '__computeActive(_domInactive, _processing)'
      },

      // Keep track of when the ui is/isn't in use.
      _domInactive: Boolean,

      // Number of files that require saving.
      _saves: {
        type: Number,
        value: 0
      },

      // Ref to '<afs-main>' element.
      _main: Object,

      // Keep track of when files are/aren't being processed.
      _processing: {
        type: Boolean,
        computed: '__computeProcessing(_saves, _uploads)'
      },

      // Controls the `<template is="dom-if"...` which wraps
      // all non-critical elements.
      // This feature keeps the memory footprint of AFS low when 
      // not in use or when only background tasks are running.
      _stamp: Boolean,

      // Number of files that require uploading.
      _uploads: {
        type: Number,
        value: 0
      },

    };
  }


  static get observers() {
    return [
      '__activeChanged(_active)',
      '__darkModeChanged(darkMode)'
    ];
  }


  __computeActive(domInactive, processing) {

    return !domInactive || processing;
  }


  __computeProcessing(saves = 0, uploads = 0) {

    return saves > 0 || uploads > 0;
  }


  async __activeChanged(active) {

    if (!active) {

      await schedule(); // Take it easy on animations, etc.

      this._stamp = false;
    }

    this.fire('app-file-system-active-changed', {value: active});
  }


  __darkModeChanged(dark) {

    if (dark) {
      this.updateStyles({
        '--gradient-start': 'var(--afs-dark-mode-start-gradient)',
        '--gradient-end':   'var(--afs-dark-mode-end-gradient)'
      });
    }
    else {
      this.updateStyles({
        '--gradient-start': 'var(--afs-light-mode-start-gradient)',
        '--gradient-end':   'var(--afs-light-mode-end-gradient)'
      });
    }
  }


  __filesAddedHandler(event) {

    // DO NOT consume or hijack this event, 
    // as it is part of the public API.

    this._saves += event.detail.files.length;
  }


  __filesSavedHandler(event) {

    // DO NOT consume or hijack this event, 
    // as it is part of the public API.

    // No longer raw "files". Now db "items".
    this._saves -= event.detail.items.length; 
  }


  __inactiveChangedHandler(event) {

    hijackEvent(event);

    this._domInactive = event.detail.value;
  }


  __uploadsCountChangedHandler(event) {

    hijackEvent(event);

    this._uploads = event.detail.value;
  }


  async __waitForStamper() {

    if (this._stamp) { 
      return this._main; 
    }

    await import(
      /* webpackChunkName: 'afs-main' */ 
      './afs-main.js'
    );

    this._stamp = true;

    await listenOnce(this.$.stamper, 'dom-change');

    // Cache the ref for short-circuiting when stamp is already true.
    this._main = this.select('#main');

    return this._main;
  }

  // Add one HTML5 File object or an array of File objects.
  async add(files) {

    const main = await this.__waitForStamper();

    return main.add(files);
  }


  async delete(uid) {

    const main = await this.__waitForStamper();

    return main.delete(uid);
  }


  async deleteAll() {

    const main = await this.__waitForStamper();

    return main.deleteAll();
  }


  async deleteMultiple(uids) {

    const main = await this.__waitForStamper();

    return main.deleteMultiple(uids);
  }


  async getData() {

    const main = await this.__waitForStamper();

    return main.getData();
  }

  // Must pass a db file item object.
  async openEditor(item) {

    const main = await this.__waitForStamper();

    return main.openEditor(item);
  }


  async openList() {

    const main = await this.__waitForStamper();

    return main.openList();
  }

  // Returns a promise that resolves to the selected file item object.
  // The promise resolves with an undefined value if the user closes
  // the selector without making a selection. 
  async openSelector() {

    const main = await this.__waitForStamper();

    return main.openSelector();
  }


  async openSources() {

    const main = await this.__waitForStamper();

    return main.openSources();
  }

  // Alias.
  open() {
    
    return this.openSources();
  }

}

window.customElements.define(AppFileSystem.is, AppFileSystem);
