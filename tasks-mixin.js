
/**
  * `TasksMixin`
  * 
  *   Handles running tasks related to HTML5 file importing, 
  *   such as, pre-processing, saving metadata to db and uploading
  *   file contents to storage.
  * 
  *   These tasks can run in the background when necessary.
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


import {capitalize} from '@longlost/app-core/lambda.js';

import {
  fsToast,
  hijackEvent,
  schedule,
  wait,
  warn
} from '@longlost/app-core/utils.js';

import {stripExt} from '@longlost/app-core/file-utils.js';

import {
  isCloudProcessable, 
  canProcess
} from '@longlost/app-core/img-utils.js';

import {
  deleteDocument,
  fileUpload,
  setBatch,
  set,
  subscribe
} from '@longlost/app-core/services/services.js';

import processFiles from './processing/processing.js';


export const TasksMixin = superClass => {

  return class TasksMixin extends superClass {


    static get properties() {
      return {

        // Used to issue new item indexes and
        // display total file count to user.
        _dbCount: Number,

        // Using maxsize and unit to calculate the total allowed bytes
        // any one file can have.
        _maxbytes: {
          type: Number,
          computed: '__computeMaxBytes(maxsize, unit)'
        },  

        _processed: {
          type: Number,
          value: 0
        },

        _processing: {
          type: Number,
          value: 0
        },

        _progress: Object,

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

        _unsubscribe: Object,        

        _uploadQty: {
          type: Number,
          value: 0,
          computed: '__computeUploadQty(_filesToUpload)'
        }

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


    __computeUploadQty(files) {

      if (!Array.isArray(files)) { return 0; }

      return files.length;
    }


    __computeMaxBytes(maxsize, unit) {

      if (!maxsize || !unit) { return; }

      const multipliers = {
        'b':  0,
        'kb': 1,
        'mb': 2,
        'gb': 3
      };

      const multiplier = multipliers[unit.toLowerCase()];

      return maxsize * multiplier * 1024;
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

      this._unsubscribe = await subscribe({
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

      this._progress = {
        processed,
        processing,
        read,
        reading
      };
    }

    // Upload successful, canceled or failed.
    __uploadDone(uid) {

      this.set(`_uploads.${uid}`, null);
      delete this._uploads[uid]; 
    }

    // Upload controls, state or progress updates.
    __uploadUpdated(upload) {

      if (this._uploads[upload.uid]) {
        const {progress, state, uid} = upload;

        this.set(`_uploads.${uid}.progress`, progress);    
        this.set(`_uploads.${uid}.state`,    state);
      }
      else {
        this.set(`_uploads.${upload.uid}`, upload);
      }
    }


    async __uploadFile(file) {

      let controls;

      const {basename, displayName, ext, uid} = file;

      const controlsCallback = uploadControls => {

        controls = uploadControls;

        const upload = {          
          controls,
          progress: 0, 
          state:   'Starting', 
          uid
        };

        this.__uploadUpdated(upload);
      };

      const doneCallback = data => {
        const {path, url} = data;

        this.__uploadDone(uid);

        set({
          coll: this.coll,
          doc:  uid,
          data: {original: url, path}
        });
      };

      const errorCallback = error => {
        // Use 'storage/canceled' to handle user canceled uploads.

        if (error.code && error.code === 'storage/unknown') {
          console.error('Upload error: ', error.code);

          warn('An error occured while uploading your file.');

          deleteDocument({coll: this.coll, doc: uid});
        }

        this.__uploadDone(uid); 
      };

      const stateChangedCallback = data => {

        const {progress, state} = data;

        const upload = {          
          controls,
          progress, 
          state: capitalize(state), 
          uid
        };

        this.__uploadUpdated(upload);
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

      fileUpload({
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
          height,
          index,
          lastModified,
          size,  
          sizeStr,
          timestamp,
          type,
          uid,
          width
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
            height,
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
            uid,
            width
          },
          merge: false
        };
      });
      
      // Previous file(s) are replaced when 'multiple' is falsey. 
      // Only one file allowed at a time.
      if (!this.multiple && this._dbData) {

        const uids = Object.keys(this._dbData);

        // Replacement operation. Delete previous file(s) and data.
        if (uids.length > 0) {

          this.__delete(uids);
        }     
      }

      await setBatch(items);

      const dbItems = items.map(item => item.data);

      // Public API.
      this.fire('app-file-system-items-saved', {items: dbItems});
    }


    async __uploadFiles(files) {

      // Start File upload to storage.
      // Add upload controls, progress and 
      // state for <upload-controls> UI.
      files.forEach(file => {
        this.__uploadFile(file);
      });

      await this.__saveItems(files);

      // May not be stamped currently.
      // AFS can work in the background without active DOM.
      this.select('#sources')?.clearFeedback();
    }


    async __openSaveAsModal() {

      await import(
        /* webpackChunkName: 'afs-save-as-modal' */ 
        './modals/afs-save-as-modal.js'
      );

      await this.__waitForStamper(); // base-mixin.js

      this.select('#saveAsModal').open(this._filesToUpload);
    }


    async __filesAdded(files) {

      // Public API.
      this.fire('app-file-system-files-added', {files});

      // These values are cached outside of try/catch since 
      // they are needed for the catch block to roll back 
      // queue in case of an error.
      let read      = 0;
      let processed = 0;

      const newToRead = files.length;
      this._reading   = this._reading + newToRead;

      const newToProcess = files.filter(canProcess).length;
      this._processing   = this._processing + newToProcess;

      try {

        // AFS can work in the background without its light dom stamped.
        this.select('#sources')?.clearFeedback();

        // Show queue tracker ui.
        this.select('#sources')?.showProgress();

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
        if (this._read === 0) {

          // Checking that 'afs-file-sources' still exists, since AFS can 
          // work in the background without its light dom stamped.
          this.select('#sources')?.hideProgress();
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
        if (
          this._read      !== this._reading || 
          this._processed !== this._processing
        ) { return; }
        
        // Give time for `paper-gauge` final count animation to finish.
        if (this.select('#sources')) {
          await wait(1200); 
        }

        // `afs-file-sources` may or may not be stamped.
        // Check read vals again, user may have added more.
        if (
          this.select('#sources') && 
          this._read      === this._reading && 
          this._processed === this._processing
        ) {
          await this.select('#sources').hideProgress();
        }

        await schedule();

        // Check read vals again, user may have added more.
        if (
          this._read      !== this._reading || 
          this._processed !== this._processing
        ) { return; }

        // Reset queue tracker values.
        this._read       = 0;       
        this._reading    = 0;
        this._processed  = 0;
        this._processing = 0;

        // Start uploading immediately.
        if (this.noUploadConfirm) {
          this.__skipRenaming();

          return;
        }

        if (this._showingUploadActions) { return; }

        this._showingUploadActions = true;
        
        // If the user is not currently viewing '#sources', 
        // then show the less intrusive fsToast instead.
        if (this.select('#sources')?.isShown()) {
          this.select('#sources').showActions();
        }  
        else {  
          const toastStr = this._uploadQty > 1 ? 'Files' : 'File';     

          // Show interactive toast from `app-shell`.
          const toastEvent = await fsToast(`${toastStr} ready to upload.`);
          const {canceled} = toastEvent.detail;

          this._showingUploadActions = false;      

          // User clicked 'Go' button. 
          // Skip the renaming process, start uploading.
          if (!canceled) {
            this.__skipRenaming();
          }

          // User clicked 'Rename' button.
          // Allow user to rename the files before uploading.
          else { 

            this.__openSaveAsModal();
          } 
        }
      }
    }

    // 'afs-file-sources'.
    __uploadActionsGoHandler(event) {

      hijackEvent(event);

      this._showingUploadActions = false;

      this.__skipRenaming();
    }

    // 'afs-file-sources'.
    __uploadActionsRenameHandler(event) {

      hijackEvent(event);

      this._showingUploadActions = false;

      this.__openSaveAsModal();
    }

    // 'afs-file-sources'.
    __filesAddedHandler(event) {

      hijackEvent(event);

      this.__filesAdded(event.detail.files);
    }


    __showFeedback(type) {

      // May or may not be stamped.
      this.select('#sources')?.showFeedback(type);

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


    __addFiles(files) {
      
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

    // Start uploading processed files as is,
    // without user editing file names.
    __skipRenaming() {

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
    __uploadRenamed(files) {
      
      this._filesToUpload = undefined;

      return this.__uploadFiles(files);
    }

  };
};
