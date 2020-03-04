
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
  isDisplayed,
  schedule,
  wait
}                 from '@longlost/utils/utils.js';
import htmlString from './upload-controls.html';
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

      file: Object,

      progress: Number,

      state: String,

      // hides pause/play button when upload is done or canceled
      _hideBtns: {
        type: Boolean,
        computed: '__computeHideBtns(file.controls)'
      },

      _paused: {
        type: Boolean,
        value: false
      }

    };
  }


  static get observers() {
    return [
      '__fileChanged(file)'
    ];
  }


  __computeHideBtns(controls) {
    return !Boolean(controls);
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


  __fileChanged(file) {

    if (!file) { 
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
    if (this.file && this.file.controls) {
      this.file.controls.cancel();
    }
  }


  pause() {
    if (this.file && this.file.controls) {
      this._paused = true;
      this.file.controls.pause();
    }
  }


  resume() {
    if (this.file && this.file.controls) {
      this._paused = false;
      this.file.controls.resume();
    }
  }

}

window.customElements.define(UploadControls.is, UploadControls);
