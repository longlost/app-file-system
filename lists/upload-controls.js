
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
import {
  capitalize
}                 from '@longlost/lambda/lambda.js';
import {
  isDisplayed,
  schedule,
  wait,
  warn
}                 from '@longlost/utils/utils.js';
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
        computed: '__computeMetadata(file)'
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


  __computeMetadata(file) {
    if (!file) { return; }

    const {displayName, ext, uid} = file;
    
    return {

      // Force 'original' file link to be 
      // downloadable when used in an anchor tag.
      // ie. <a download href="http://original-file-url.ext">Download Me</a>.
      contentDisposition: `attachment; filename="${displayName}${ext}"`,

      // 'metadata.customMetadata' in client sdk, 
      // 'metadata.metadata' in cloud functions.
      customMetadata: {uid}
    }; 
  }


  async __show() {
    if (isDisplayed(this)) { return; }

    await wait(800);

    // If processing happens faster than animation timing, abort.
    if (isDisplayed(this) || !this.file) { return; }

    this.style['display'] = 'flex';
    await schedule();
    this.style['transform'] = 'unset';
  }


  async __hide() {
    this.style['transform'] = 'translateY(100%)';
    await wait(350);
    this.style['display'] = 'none';
  }


  __fileChanged(file, metadata) {
    if (
      !file ||
      !metadata || 
      !metadata.customMetadata.uid
    ) { 
      this.__hide();
      return; 
    }

    if (!this.coll) { 
      throw new Error(`upload-controls must have a 'coll' set`); 
    }

    this.__uploadFile(file, metadata);
    this.__show();
  } 


  __uploadFinished({path, url}) {
    const {uid}           = this.file;
    this._controls        = undefined;
    this._state           = 'Done';
    this._hideControlBtns = true;

    this.fire('upload-complete', {
      original: url,
      path,
      uid
    });
  }


  __uploadFile(file, metadata) {

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
        this._state           = 'Canceled';
        return;
      }

      if (error.code_ && error.code_ === 'storage/unknown') {
        this._controls        = undefined;
        this._hideControlBtns = true;
        this._state           = 'Error';
        warn('An error occured while uploading your file.');
        return;
      }

      // TODO:
      //      show error feedback ui


      console.error('Upload error: ', error.code_);

    };

    const stateChangedCallback = data => {
      const {progress, state} = data;
      this._progress = progress;
      this._state    = capitalize(state);
    };

    const path = `${this.coll}/${file.uid}/${file.basename}`;

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
