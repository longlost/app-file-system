
/**
  * `BaseMixin`
  * 
  *   Properties and methods common across TaskMixin, EventsMixin and 'afs-main'.
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
  *    
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/



import {listenOnce, schedule} from '@longlost/app-core/utils.js';


export const BaseMixin = superClass => {

  return class BaseMixin extends superClass {


    static get properties() {
      return {

        // Firestore collection name.
        coll: String,

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

        // An object version of the items returned from the database.
        // Used for quick and easy access to file items via uid.
        _dbData: Object,        

        _filesToUpload: Array,
        
        _inactive: {
          type: Boolean,
          computed: '__computeInactive(_overlaysCount, _spinnerShown)'
        },

        // Keep track of overlays that are in use.
        _overlaysCount: Number,

        _spinnerShown: Boolean,

        // Controls the `<template is="dom-if"...` which wraps
        // all non-critical elements.
        // This feature keeps the memory footprint of AFS low when 
        // not in use or when only background tasks are running.
        _stamp: Boolean,

        // Upload controls, progress and state.
        // Consumed by 'afs-upload-controls' ui.
        _uploads: {
          type: Object,
          value: () => ({})
        },

        _uploadsCount: {
          type: Number,
          computed: '__computeUploadsCount(_uploads.*)'
        }

      };
    }


    static get observers() {
      return [
        '__inactiveChanged(_inactive)',
        '__uploadsCountChanged(_uploadsCount)'
      ];
    }


    connectedCallback() {

      super.connectedCallback();

      // Keep track of overlays that are in use.
      // Remove stamped elements when not in use
      // to reduce DOM footprint.
      // Specifically, it's safe to unstamp when
      // all overlays/modals are closed and the 
      // spinner is inactive.
      this.__overlayOpeningHandler = this.__overlayOpeningHandler.bind(this);
      this.__overlayResetHandler   = this.__overlayResetHandler.bind(this);
      
      this.addEventListener('overlay-preparing-to-open', this.__overlayOpeningHandler);      
      this.addEventListener('overlay-reset',             this.__overlayResetHandler);
    }


    disconnectedCallback() {

      super.disconnectedCallback();     

      this.removeEventListener('overlay-preparing-to-open', this.__overlayOpeningHandler);      
      this.removeEventListener('overlay-reset',             this.__overlayResetHandler);
    }


    __computeInactive(openCount, spinnerShown) {

      return openCount === 0 && !spinnerShown;
    }


    __computeUploadsCount(obj) {

      if (!obj || !obj.base) { return 0; }

      // Return the number of active uploads.
      // nullish values don't count.
      return Object.
               values(obj.base).
               filter(val => 
                Boolean(val)).length;
    }


    async __inactiveChanged(inactive) {

      // Safe to unstamp when all overlays/modals 
      // are closed and the spinner is inactive.
      if (inactive) {

        await schedule(); // Take it easy on underlay animations.

        this._stamp = false;
      }

      this.fire('inactive-changed', {value: inactive});
    }


    __uploadsCountChanged(count) {

      this.fire('uploads-count-changed', {value: count});
    }


    __overlayOpeningHandler() {

      // Initialize value late.
      if (this._overlaysCount === undefined) {

        this._overlaysCount = 1;

        return;
      }

      this._overlaysCount += 1;
    }


    __overlayResetHandler() {

      this._overlaysCount -= 1;
    }


    async __importSpinner() {
 
      await import(
        /* webpackChunkName: 'app-spinner' */ 
        '@longlost/app-spinner/app-spinner.js'
      );

      await this.__waitForStamper();

      return this.select('#spinner');
    }


    async __hideSpinner() {

      const spinner = await this.__importSpinner();

      await spinner.hide();

      this._spinnerShown = false;
    }


    async __showSpinner(str) {

      this._spinnerShown = true;

      const spinner = await this.__importSpinner();

      return spinner.show(str);
    }


    __waitForStamper() {

      if (this._stamp) { 
        return Promise.resolve(); 
      }

      this._stamp = true;

      return listenOnce(this.$.stamper, 'dom-change');
    }

  };
};
