

/**
  * `afs-file-editor`
  * 
  *   Update file displayName, add notes and keywords.
  *
  *
  *
  *
  *  Properties:
  *
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
  *  Methods:
  *
  *
  *    open()
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement}     from '@longlost/app-core/app-element.js';
import {schedule, wait} from '@longlost/app-core/utils.js';
import {EditorMixin}    from './editor-mixin.js';
import template         from './afs-file-editor.html';
import '../shared/afs-file-icons.js';
import '../shared/afs-action-buttons.js';
import '../shared/afs-edit-photo-fab.js';
// Map lazy loaded.


class AFSFileEditor extends EditorMixin(AppElement) {

  static get is() { return 'afs-file-editor'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _hideLaunchBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideLaunchBtn(_isImg, _isVid)'
      },

      _hideLazyImg: {
        type: Boolean,
        value: true,
        computed: '__computeHideLazyImg(_isImg, _isVid, _vidPoster)'
      },

      _hideLazyVideo: {
        type: Boolean,
        value: true,
        computed: '__computeHideLazyVideo(_isVid, _vidPoster)'
      },

      _src: {
        type: String,
        computed: '__computeSrc(_imgSrc, _vidPoster)'
      }

    };
  }


  __computeHeaderSize(isImg, isVid) {

    return isImg || isVid ? 5 : 2;
  }


  __computeHideLaunchBtn(isImg, isVid) {

    return !isImg && !isVid;
  }


  __computeHideLazyImg(isImg, isVid, poster) {

    if (isImg) { return false; }

    // Don't hide if there is a video poster present.
    if (isVid && poster) { return false; }

    return true;
  }


  __computeHideLazyVideo(isVid, poster) {

    return !isVid || poster;
  }


  __computeSrc(imgSrc, poster) {

    return imgSrc ? imgSrc : poster;
  }


  async __launchBtnClicked() {

    try {
      await this.clicked();

      if (this._isVid) {
        this.fire('open-video-viewer', {item: this.item});
      }
      else {
        this.fire('open-photo-viewer', {item: this.item});
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __back() {

    this.$.fab.exit();

    await wait(100);

    this.$.overlay.back();
  }

  // `app-header-overlay` 'on-overlay-reset' handler.
  __reset() {

    // Remove the class in case the overlay 
    // is reset programmatically.
    this.$.fab.reset();
  }


  async open() {

    await  this.$.overlay.open();
    return this.$.fab.enter();
  }

  // Used for confirmed delete actions.
  reset() {
    
    return this.$.overlay.reset();
  }

}

window.customElements.define(AFSFileEditor.is, AFSFileEditor);
