
/**
  * `device-file-card`
  * 
  *   A card that allows user to add files from their device's hard drive. 
  *   
  *   Button press to access native file picker.
  *   Drag and drop zone.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  *    hideDropzone - <Boolean> optional: undefined -> If true, do not display file dropzone.
  *
  *
  *    maxfiles - <Number> optional: undefined -> The maximum allowed number of files a user can have.
  *
  *
  *    maxsize - <Number> optional: undefined -> The maximum number of units a single file cannot exceed.
  * 
  *
  *    multiple - <Boolean> optional: false -> Only accept one file at a time, 
  *               true -> Allow many files at the same time.
  *               false -> Only allow one file at a time. Each new file replaces the previous one.
  *
  *
  *    unit - <String> optional: 'kB' -> Configures the order of magnitude of bytes to display, 
  *                                      and how to measure maxsize.
  *
  *
  *
  *  Events:
  *
  *
  *
  *    'files-added' - Fired after user adds files from their device file chooser.
  *                       detail -> {files: <Array of JS File Objects>}
  *
  *  
  *
  *  
  *  Methods:
  *
  *
  *    createFeedback(type) - Show file user error feedback in dropzone.
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  hijackEvent
}                 from '@longlost/utils/utils.js';
import htmlString from './device-file-card.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/file-icons.js';
import './drop-zone.js';


class DeviceFileCard extends AppElement {
  static get is() { return 'device-file-card'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Any valid HTML5 input accept string or
      // one of 3 shorthand values: 'image', 'video' or 'audio'.
      accept: String,

      // Set to true to hide the add and delete dropzones.
      hideDropzone: Boolean,

      // The maximum allowed number of files a user can have.
      maxfiles: Number,

      // The maximum number of units a single file cannot exceed.
      maxsize: Number,

      // One file upload or multiple files.
      multiple: Boolean,

      // Configures the order of magnitude of bytes to display, 
      // and how to measure maxsize.
      unit: String // 'B', 'kB', 'MB' or 'GB'

    };
  }


  __chooserBtnClicked() {
    // Cannot use 'await this.clicked()' here because of Safari.
    this.$.dropzone.openChooser();
  }


  __dzFilesAdded(event) {    
    hijackEvent(event);

    this.fire('files-added', {files: event.detail.files});
  }


  clearFeedback() {
    this.$.dropzone.clearFeedback();
  }


  createFeedback(type) {
    this.$.dropzone.createFeedback(type);
  }

}

window.customElements.define(DeviceFileCard.is, DeviceFileCard);
