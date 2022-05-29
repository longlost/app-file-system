
/**
  * `afs-upload-controls`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

  
import {AppElement} from '@longlost/app-core/app-element.js';

import {
  isDisplayed,
  schedule,
  wait
} from '@longlost/app-core/utils.js';

import template from './afs-upload-controls.html';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-progress/paper-progress.js';
import '../shared/afs-file-icons.js';


class AFSUploadControls extends AppElement {

  static get is() { return 'afs-upload-controls'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      progress: Number,

      state: String,

      // File upload controls, progress and state.
      upload: Object,

      // hides pause/play button when upload is done or canceled
      _hideBtns: {
        type: Boolean,
        computed: '__computeHideBtns(upload)'
      },

      _paused: {
        type: Boolean,
        value: false
      }

    };
  }


  static get observers() {
    return [
      '__uploadChanged(upload)'
    ];
  }


  __computeHideBtns(upload) {

    return !Boolean(upload);
  }


  async __show() {

    if (isDisplayed(this)) { return; }

    await wait(800);

    // If processing happens faster than animation timing, abort.
    if (isDisplayed(this) || !this.upload) { return; }

    this.style['display'] = 'flex';
    await schedule();
    this.style['transform'] = 'unset';
  }


  async __hide() {

    this.style['transform'] = 'translateY(100%)';
    await wait(350);
    this.style['display'] = 'none';
  }


  __uploadChanged(upload) {

    if (!upload) { 
      this.__hide();
    }
    else {
      this.__show();
    }
  }


  async __pauseUploadButtonClicked() {

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

    if (this.upload && this.upload.controls) {
      this.upload.controls.cancel();
    }
  }


  pause() {

    if (this.upload && this.upload.controls) {
      this._paused = true;
      this.upload.controls.pause();
    }
  }


  resume() {
    
    if (this.upload && this.upload.controls) {
      this._paused = false;
      this.upload.controls.resume();
    }
  }

}

window.customElements.define(AFSUploadControls.is, AFSUploadControls);
