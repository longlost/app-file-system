
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
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  capitalize,
  compose,
  head,
  map,
  split
} from '@longlost/app-core/lambda.js';

import {
  hijackEvent,
  isDisplayed
} from '@longlost/app-core/utils.js';

import mime         from 'mime-types';
import descriptions from './mime-descriptions.json';
import template     from './afs-file-sources.html';
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
    return template;
  }


  static get properties() {
    return {

      // Any valid HTML5 input accept string or
      // one of 3 shorthand values: 'image', 'video' or 'audio'.
      accept: String,

      // Same as Firestore collection save location.
      coll: String,

      // Used to issue new item indexes and
      // display total file count to user.
      count: Number,

      // Set to true to hide the add and delete dropzones.
      hideDropzone: Boolean,

      list: String, // 'files' or 'photos'.

      maxfiles: Number,

      maxsize: Number,

      // One file upload or multiple files.
      multiple: Boolean,      

      progress: Object,

      // Only invoke toast once at a time, since 
      // the user is allowed to continue adding 
      // files while others are being processed.
      showingUploadActions: Boolean,

      unit: String, // 'B', 'kB', 'MB' or 'GB'

      uploadQty: Number,

      // Human-readable string of acceptable file types
      // displayed at top of card as a hint for user.
      _acceptableTypes: {
        type: String,
        computed: '__computeAcceptableTypes(_mimes)'
      },

      // Hide actions when count is unavailable
      // because it is neccessary for issuing indexes
      // properly to new items.
      _hideContent: {
        type: Boolean,
        value: true,
        computed: '__computeHideContent(count)'
      },  

      // This array containes mime types (ie. 'image/jpeg').
      // It us used to check against fetch response 'content-type' in order
      // to be sure we are only loading the desired types of files.
      _mimes: {
        type: Array,
        computed: '__computeMimeTypes(accept)'
      }

    };
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


  __computeHideContent(count) {

    return typeof count !== 'number';
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


  __uploadActionsGo(event) {

    hijackEvent(event);

    this.fire('upload-actions-go');
  }


  __uploadActionsRename(event) {

    hijackEvent(event);

    this.fire('upload-actions-rename');
  }


  __webFileAdded(event) {

    hijackEvent(event);

    this.fire('files-added', {files: [event.detail.file]});
  }


  __deviceFilesAdded(event) {   

    hijackEvent(event);

    this.fire('files-added', {files: event.detail.files});
  }


  async __back() {

    try {
      await this.clicked();

      if (this.showingUploadActions) {
        await this.$.actions.nudge();
      }
      else {
        await this.$.overlay.back();
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  clearFeedback() {

    this.$.deviceFileCard.clearFeedback();
  }


  showFeedback(type) {

    this.$.deviceFileCard.createFeedback(type);
  }


  showActions() {

    return this.$.actions.show();
  }

  // Hide queue tracker ui.
  hideProgress() {

    return this.$.progress.hide();
  }

  // Show queue tracker ui.
  showProgress() {

    return this.$.progress.show();
  }

  // Content will be 'display: none' when the 'app-header-overlay'
  // is either not opened, or when any other overlays are open above it.
  isShown() {

    return isDisplayed(this.$.overlay.content);
  }


  open() {

    return this.$.overlay.open();
  }

}

window.customElements.define(AFSFileSources.is, AFSFileSources);
