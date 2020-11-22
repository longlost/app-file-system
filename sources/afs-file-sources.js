
/**
  * `afs-file-sources`
  * 
  *   An overlay that allows users to add files to an app
  *   from several different sources. 
  *   
  *   Button press to access native file picker.
  *   Drag and drop zone.
  *   File url input.
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
  *    multiple - <Boolean> optional: false -> only accept one file at a time, true -> allow many files at the same time.
  *               default -> false
  *
  *
  *
  *  Events:
  *
  *
  *
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
} from '@longlost/app-element/app-element.js';

import {
  capitalize,
  compose,
  head,
  map,
  split
} from '@longlost/lambda/lambda.js';

import {
  fsToast,
  hijackEvent,
  isDisplayed,
  listenOnce,
  schedule,
  wait,
  warn
} from '@longlost/utils/utils.js';

import {
  isCloudProcessable, 
  stripExt
} from '../shared/utils.js';

import mime          from 'mime-types';
import descriptions  from './mime-descriptions.json';
import services      from '@longlost/app-shell/services/services.js';
import * as imgUtils from '../shared/img-utils.js';
import processFiles  from './processing.js';
import htmlString    from './afs-file-sources.html';
import '@longlost/app-overlays/app-header-overlay.js';
import '../shared/afs-progress-bar.js';
import './afs-upload-actions-card.js';
import './afs-list-icon-button.js';
import './afs-web-file-card.js';
import './afs-device-file-card.js';


// These helpers used to compute _mimes.
const trim = str => str.trim();
const getAcceptEntries = compose(split(','), map(trim));
const removeWildCards  = compose(split('/*'), head);

// Use arrow function here to block extra arguments 
// that map passes into the map function.
const getMimeTypes = map(str => removeWildCards(str));


class AFSFileSources extends AppElement {
  static get is() { return 'afs-file-sources'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Any valid HTML5 input accept string or
      // one of 3 shorthand values: 'image', 'video' or 'audio'.
      accept: String,

      // Same as Firestore collection save location.
      coll: String,

      // Used for <list-icon-button> calculation and animations.
      // Object form of database items.
      data: Object,

      // Set to true to hide the add and delete dropzones.
      hideDropzone: Boolean,

      list: String, // 'files' or 'photos'.

      maxfiles: Number,

      maxsize: Number,

      // One file upload or multiple files.
      multiple: Boolean,

      // If set, afs will not ask the user to confirm
      // uploading files after processing.
      noUploadConfirm: Boolean,

      unit: String, // 'B', 'kB', 'MB' or 'GB'

      // Human-readable string of acceptable file types
      // displayed at top of card as a hint for user.
      _acceptableTypes: {
        type: String,
        computed: '__computeAcceptableTypes(_mimes)'
      },

      // Used to issue new item indexes and
      // display total file count to user.
      _dbCount: Number,

      _filesToUpload: Array,

      _filesToUploadQty: {
        type: Number,
        value: 0,
        computed: '__computeFilesToUploadQty(_filesToUpload)'
      },

      // Hide actions when _dbCount is unavailable
      // because it is neccessary for issuing indexes
      // properly to new items.
      _hideContent: {
        type: Boolean,
        value: true,
        computed: '__computeHideContent(_dbCount)'
      },

      // Using maxsize and unit to calculate the total allowed bytes
      // any one file can have.
      _maxbytes: {
        type: Number,
        computed: '__computeMaxBytes(maxsize, unit)'
      },    

      // This array containes mime types (ie. 'image/jpeg').
      // It us used to check against fetch response 'content-type' in order
      // to be sure we are only loading the desired types of files.
      _mimes: {
        type: Array,
        computed: '__computeMimeTypes(accept)'
      },

      _processed: {
        type: Number,
        value: 0
      },

      _processing: {
        type: Number,
        value: 0
      },

      _read: {
        type: Number,
        value: 0
      },

      _reading: {
        type: Number,
        value: 0
      },

      // Only invoke toast once at a time, since 
      // the user is allowed to continue adding 
      // files while others are being processed.
      _showingUploadActions: Boolean,

      // Controls the <template> dom-if.
      // Reduce dom footprint when not in use,
      // or when AFS is used in the background.
      _stamp: {
        type: Boolean,
        value: false
      },

      _unsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__collChanged(coll)',
      '__progressValuesChanged(_reading, _read, _processing, _processed)'
    ];
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.__unsub();
  }


  __computeAcceptableTypes(mimes) {
    if (!mimes) { return ''; }

    const description = mimes.reduce((accum, m) => {
      const desc = descriptions[m];

      if (desc) {
        accum = accum ? `${accum}, ${desc}` : desc;
      }
      
      return accum;
    }, '');

    return `${capitalize(description)}`;
  }


  __computeFilesToUploadQty(files) {
    if (!Array.isArray(files)) { return 0; }

    return files.length;
  }


  __computeHideContent(dbCount) {
    return typeof dbCount !== 'number';
  }


  __computeMaxBytes(maxsize, unit) {
    if (!maxsize || !unit) { return; }

    const mulipliers = {
      'b':  0,
      'kb': 1,
      'mb': 2,
      'gb': 3
    };

    const muliplier = mulipliers[unit.toLowerCase()];

    return maxsize * muliplier * 1024;
  }


  __computeMimeTypes(accept) {
    if (!accept) { return; }

    // The comma seperated accept entries.
    const entries = getAcceptEntries(accept);

    // Use the 'mime-types' library to lookup the 
    // corresponding header content-type strings
    // that align with the accept string.
    const types = entries.map(entry => {

      // Returns false if none is found.
      const type = mime.contentType(entry);

      return type ? type : entry; // Fallback to entry string.
    });

    // Take out wild cards. (ie. 'image/*' -> 'image')
    const mimes = getMimeTypes(types);

    return mimes;
  }


  __unsub() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }


  async __collChanged(coll) {

    if (!coll) {
      this.__unsub();
      this._dbCount = undefined;
      return;
    }

    const callback = results => {

      if (results.length > 0) {
        this._dbCount = results[0].index + 1;
      }
      else {
        this._dbCount = 0;
      }
    };

    const errorCallback = error => {

      if (error && error.message && error.message.includes('document does not exist')) {
        this._dbCount = 0;
        return;
      }

      this._dbCount = undefined;
      console.error(error);
    };

    this._unsubscribe = await services.subscribe({
      callback,
      coll,
      errorCallback,
      limit: 1,
      orderBy: {
        prop:      'index',
        direction: 'desc'
      }
    });
  }


  __progressValuesChanged(reading, read, processing, processed) {
    this.fire('progress-changed', {
      processed,
      processing,
      read,
      reading
    });
  }


  async __listBtnClicked() {
    try {
      await this.clicked();
      this.fire('open-list');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __uploadFile(file) {

    let controls;

    const {basename, displayName, ext, uid} = file;

    const controlsCallback = uploadControls => {
      controls = uploadControls;

      this.fire('upload-updated', {
        upload: {          
          controls,
          progress: 0, 
          state:   'Starting', 
          uid
        }
      });
    };

    const doneCallback = data => {
      const {path, url} = data;

      this.fire('upload-done', {uid});

      services.set({
        coll: this.coll,
        doc:  uid,
        data: {original: url, path}
      });
    };

    const errorCallback = error => {
      // Use 'storage/canceled' to handle user canceled uploads.

      if (error.code_ && error.code_ === 'storage/unknown') {
        console.error('Upload error: ', error.code_);

        warn('An error occured while uploading your file.');

        services.deleteDocument({coll: this.coll, doc: uid});
      }

      this.fire('upload-done', {uid}); 
    };

    const stateChangedCallback = data => {
      const {progress, state} = data;

      this.fire('upload-updated', {
        upload: {          
          controls,
          progress, 
          state: capitalize(state), 
          uid
        }
      });
    };

    // Custom contentDisposition required to 
    // show the user's chosen displayName in the
    // browser ui as the default file name when
    // the file is downloaded.
    // Custom metadata is used in cloud functions
    // to save urls that point to processed 
    // versions of the original file back to db.
    const metadata = {

      // Force 'original' file link to be 
      // downloadable when used in an anchor tag.
      // ie. <a download href="http://original-file-url.ext">Download Me</a>.
      contentDisposition: `attachment; filename="${displayName}${ext}"`,

      // 'metadata.customMetadata' in client sdk, 
      // 'metadata.metadata' in cloud functions.
      customMetadata: {uid}
    }; 

    const path = `${this.coll}/${uid}/${basename}`;

    services.fileUpload({
      controlsCallback:     controlsCallback,
      doneCallback:         doneCallback,
      errorCallback:        errorCallback, 
      file,
      metadata,
      path,
      stateChangedCallback: stateChangedCallback
    });
  }

  // Strip out File data, keep file metadata, since it must be uploaded
  // via Firebase storage and is not allowed in Firestore.
  async __saveItems(files) {

    const items = files.map(file => {

      // Cannot destructure the File object since it
      // is not a true iterable JS object.
      const {
        _tempUrl,      
        basename,
        category,
        displayName,
        exif,
        ext,
        index,
        lastModified,
        size,  
        sizeStr,
        timestamp,
        type,
        uid,
      } = file;

      // `data` becomes the database document item.
      return {
        coll: this.coll,
        doc: uid,
        data: {
          _tempUrl,
          basename,
          category,
          coll: this.coll,
          displayName,
          doc: uid,
          exif,
          ext,
          index:         index + this._dbCount,
          isProcessable: isCloudProcessable(file),
          lastModified,
          optimized:      null,
          optimizedError: null,
          original:       null,
          poster:         null,
          size, 
          sizeStr,
          thumbnail:      null,
          thumbnailError: null,
          timestamp,
          type,
          uid
        },
        merge: false
      };
    });
    
    // Replacement operation. Delete previous file and its data.
    if (!this.multiple && this.data) {

      const uids = Object.keys(this.data);

      if (uids.length > 0) {
        this.fire('delete-previous', {uids});
      }     
    }

    return services.saveItems(items);
  }


  async __uploadFiles(files) {

    // Start File upload to storage.
    // Add upload controls, progress and 
    // state for <upload-controls> UI.
    files.forEach(file => {
      this.__uploadFile(file);
    });

    await this.__saveItems(files);

    const cardEl = this.select('#deviceFileCard');

    // `afs-file-sources` can work without its light dom stamped.
    if (cardEl) {
      cardEl.clearFeedback();
    }
  }


  async __filesAdded(files) {

    // These values are cached outside of try/catch since 
    // they are needed for the catch block to roll back 
    // queue in case of an error.
    let read      = 0;
    let processed = 0;

    const newToRead = files.length;
    this._reading   = this._reading + newToRead;

    const newToProcess = files.filter(imgUtils.canProcess).length;
    this._processing   = this._processing + newToProcess;

    const cardEl     = this.select('#deviceFileCard');
    const progressEl = this.select('#progress');

    try {
      // `afs-file-sources` can work without its light dom stamped.
      if (cardEl) {
        cardEl.clearFeedback();
      }

      // Show queue tracker ui.
      // `afs-file-sources` can work without its light dom stamped.
      if (progressEl) {
        progressEl.show();
      }

      // Updates "read" gauge ui when invoked.
      // This happens after a uid has been issued
      // and exif/dimension info has been read from
      // supported images, but before image processing
      // begins.
      const readCallback = () => {        
        read       += 1;
        this._read += 1;
      };

      // Updates "processed" gauge ui when invoked.
      const processedCallback = () => {
        processed       += 1;
        this._processed += 1;
      };

      const processedFiles = await processFiles(files, readCallback, processedCallback);

      // Drives modal repeater.
      // Add new files to queue (existing modal items).
      if (Array.isArray(this._filesToUpload)) {
        this.push('_filesToUpload', ...processedFiles);
      }
      else {
        this._filesToUpload = processedFiles;
      }
    }
    catch (error) {
      console.error(error);

      // Roll-back queues by number of failed items. 
      this._reading    = this._reading    - newToRead    - read;
      this._processing = this._processing - newToProcess - processed;

      // An error occured that stopped all files from being processed.
      // Checking progressEl since `afs-file-sources` can work without 
      // its light dom stamped.
      if (this._read === 0 && progressEl) {
        progressEl.hide();
      } 

      await warn('An error occured while gathering your files.');
    }
    finally {

      // Wait to read progress values for late running callbacks.
      // Safari sometimes runs the last 'processedCallback' AFTER
      // resolving the 'processFiles' promise.
      await schedule();

      // An error occured that stopped all files from being processed.
      if (this._read === 0) { return; }

      // Not done yet, user added more.
      if (this._read !== this._reading || this._processed !== this._processing) { return; }
      
      // Give time for `paper-gauge` final count animation to finish.
      await wait(1200); 

      // `afs-file-sources` can work without its light dom stamped.
      // Check read vals again, user may have added more.
      if (progressEl && this._read === this._reading && this._processed === this._processing) {
        await progressEl.hide();
      }

      await schedule();

      // Check read vals again, user may have added more.
      if (this._read !== this._reading || this._processed !== this._processing) { return; }

      // Reset queue tracker values.
      this._read       = 0;       
      this._reading    = 0;
      this._processed  = 0;
      this._processing = 0;

      // Start uploading immediately.
      if (this.noUploadConfirm) {
        this.skipRenaming();

        return;
      }

      if (this._showingUploadActions) { return; }

      this._showingUploadActions = true;

      // Content will be 'display: none' when the 'app-header-overlay'
      // is either not opened, or when any other overlays are open above it.
      // So if the user is not currently viewing this element, then show
      // the less intrusive fsToast instead.
      const overlay = this.select('#overlay');

      if (overlay && isDisplayed(overlay.content)) {
        this.select('#actions').show();
      }  
      else {  
        const toastStr = this._filesToUploadQty > 1 ? 'Files' : 'File';     

        // Show interactive toast from `app-shell`.
        const toastEvent = await fsToast(`${toastStr} ready to upload.`);
        const {canceled} = toastEvent.detail;

        this._showingUploadActions = false;      

        // User clicked 'Go' button. 
        // Skip the renaming process, start uploading.
        if (!canceled) {
          this.skipRenaming();
        }

        // User clicked 'Rename' button.
        // Allow user to rename the files before uploading.
        else { 
          this.fire('open-save-as-modal', {files: this._filesToUpload});
        } 
      }
    }
  }


  __uploadActionsGo(event) {
    hijackEvent(event);

    this._showingUploadActions = false;

    this.skipRenaming();
  }


  __uploadActionsRename(event) {
    hijackEvent(event);

    this._showingUploadActions = false;

    this.fire('open-save-as-modal', {files: this._filesToUpload});
  }


  __webFileAdded(event) {
    hijackEvent(event);

    this.__filesAdded([event.detail.file]);
  }


  __deviceFilesAdded(event) {    
    hijackEvent(event);

    this.__filesAdded(event.detail.files);
  }


  async __showFeedback(type) {
    const cardEl = this.select('#deviceFileCard');

    // `afs-file-sources` can work without its light dom stamped.
    if (cardEl) {
      cardEl.createFeedback(type);      
    }

    return warn('Could not add those files.');
  }


  __handleMultipleFiles(files) {
    const array = [...files];

    if (this.maxfiles && array.length > this.maxfiles) {
      this.__showFeedback('tooMany');
    }
    else if (array.some(file => this._maxbytes && file.size > this._maxbytes)) {
      this.__showFeedback('tooLarge');
    }
    else {
      this.__filesAdded(array);
    }
  }


  __handleSingleFile(file) {

    if (this._maxbytes && file.size > this._maxbytes) {
      this.__showFeedback('tooLarge');
    }
    else {
      this.__filesAdded([file]);
    }
  }


  async __back() {
    try {
      await this.clicked();

      if (this._showingUploadActions) {
        this.select('#actions').nudge();
      }
      else {
        await this.select('#overlay').back();
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __reset() {
    this._stamp = false;
  }

  
  addFiles(files) {
    
    if (this.multiple) {
      this.__handleMultipleFiles(files);
    }
    else if (files.length === 1) {
      this.__handleSingleFile(files[0]);
    }
    else {
      this.__showFeedback('single');
    }
  }


  async open() {
    this._stamp = true;

    await listenOnce(this.$.stamper, 'dom-change');
    await schedule();

    return this.select('#overlay').open();
  }

  // Start uploading processed files as is,
  // without user editing file names.
  skipRenaming() {
    if (!Array.isArray(this._filesToUpload)) { return; }

    const files = this._filesToUpload.map(file => {
      file.displayName = stripExt(file.name);
      return file;
    });

    this._filesToUpload = undefined;

    return this.__uploadFiles(files);
  }

  // Start uploading processed files that have 
  // user edited/updated file names.
  uploadRenamed(files) {
    this._filesToUpload = undefined;

    return this.__uploadFiles(files);
  }

}

window.customElements.define(AFSFileSources.is, AFSFileSources);
