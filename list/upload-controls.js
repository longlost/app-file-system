
/**
  * `upload-controls`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

  
import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {warn}     from '@longlost/utils/utils.js';
import htmlString from './upload-controls.html';
import services   from '@longlost/services/services.js';
import '@longlost/app-icons/app-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-progress/paper-progress.js';


class UploadControls extends AppElement {
  static get is() { return 'upload-controls'; }

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
      field: {
        type: String,
        value: 'files'
      },

      file: Object,
      // file upload controls
      // {cancel, pause, resume}
      _controls: Object,
      // hides pause/play button when upload is done or canceled
      _hideControlBtns: Boolean,
      // Custom metadata associated with file data.
      // Used in 'optimize' cloud function to 
      // properly save processed file urls to
      // the correct place in Firestore.
      _metadata: {
        type: Object,
        computed: '__computeMetadata(field, file.uid)'
      },
      // upload progress
      _progress: Number,

      _paused: {
        type: Boolean,
        value: false
      },
      // upload state
      _state: String

    };
  }


  static get observers() {
    return [
      '__fileChanged(file, _metadata)'
    ];
  }


  __fileChanged(file, metadata) {
    if (
      !file || 
      !metadata || 
      !metadata.customMetadata.uid || 
      !metadata.customMetadata.field
    ) { return; }

    if (!this.coll || !this.doc) { 
      throw new Error(`drag-drop-files must have both 'coll' and 'doc' set`); 
    }

    this.__uploadFile(file, metadata);
  } 


  __computeMetadata(field, uid) {
    // 'metadata.customMetadata' in client sdk, 
    // 'metadata.metadata' in cloud functions.
    return {customMetadata: {field, uid}}; 
  }


  __uploadFinished(data) {
    const {url, path}     = data;
    const {uid}           = this.file;
    this._controls        = undefined;
    this._state           = 'done';
    this._hideControlBtns = true;

    this.fire('upload-complete', {
      original: url,
      path,
      uid
    });
  }


  __uploadFile(file, metadata) {

    const dir  = `${this.coll}/${this.doc}`;

    const controlsCallback = controls => {
      // controls === {cancel, pause, resume}
      this._controls = controls;
    };

    const doneCallback = data => {
      this.__uploadFinished(data);
    };

    const errorCallback = error => {
      if (error.code_ && error.code_ === 'storage/canceled') {
        this._controls        = undefined;
        this._hideControlBtns = true;
        this._state           = 'canceled';
        return;
      }

      if (error.code_ && error.code_ === 'storage/unknown') {
        this._controls        = undefined;
        this._hideControlBtns = true;
        this._state           = 'errored';
        warn('An error occured while uploading your file.');
        return;
      }

      // TODO:
      //      show error feedback ui


      console.error('upload error: ', error.code_);

    };

    const stateChangedCallback = data => {
      const {progress, state} = data;
      this._progress = progress;
      this._state    = state
    };

    services.fileUpload({
      controlsCallback:     controlsCallback,
      dir, 
      doneCallback:         doneCallback,
      errorCallback:        errorCallback, 
      file,
      metadata, 
      name:                 file.uid, 
      stateChangedCallback: stateChangedCallback
    });    
  }


  async __pauseUploadButtonClicked() {
    if (!this._controls) { return; }
    try {
      await this.clicked();
      this.pause();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }   
  }


  async __resumeUploadButtonClicked() {
    if (!this._controls) { return; }
    try {
      await this.clicked();
      this.resume();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }   
  }


  cancel() {
    if (this._controls) {
      this._controls.cancel();
    }
  }


  pause() {
    if (this._controls) {
      this._paused = true;
      this._controls.pause();
    }
  }


  resume() {
    if (this._controls) {
      this._paused = false;
      this._controls.resume();
    }
  }

}

window.customElements.define(UploadControls.is, UploadControls);
