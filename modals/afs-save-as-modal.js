

/**
  * `afs-save-as-modal`
  * 
  *   This UI modal allows the user to edit file names before uploading them.
  *
  *
  *   
  *
  *
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
  *  Methods:
  *
  *
  *    
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  listenOnce,
  schedule,
  warn
} from '@longlost/app-core/utils.js';

import {stripExt} from '@longlost/app-core/file-utils.js';
import htmlString from './afs-save-as-modal.html';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';
import './afs-save-as-modal-input-item.js';


class AFSSaveAsModal extends AppElement {
  static get is() { return 'afs-save-as-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      list: String,

      _editorType: {
        type: String,
        computed: '__computeEditorType(list)'
      },

      _files: Array,   

      // Cached input values.
      _fileNames: {
        type: Object,
        value: () => ({})
      }

    };
  }


  __computeEditorType(list) {
    return list === 'files' ? 'file' : 'image';
  }


  __itemValueChanged(event) {
    hijackEvent(event);
    
    const {uid, value} = event.detail;

    // Don't save empty name values, 
    // use file name instead.
    if (!value) {
      delete this._fileNames[uid];
    }
    else {
      this._fileNames[uid] = value;
    }
  }


  async __reset() {
    await schedule();       
    await this.$.modal.close();

    this._files     = undefined;
    this._fileNames = {};
  }


  async __skipButtonClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();
      await this.__reset();

      this.fire('skip');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      warn('An error occured while adding files.');
    }
  }


  async __updateButtonClicked(event) {
    try {
      hijackEvent(event);

      await this.clicked();

      const renamedFiles = this._files.map(file => {

        // Use user edits from modal input.
        if (this._fileNames[file.uid]) {

          // Cannot use object spread notation on object-like File.
          file.displayName = this._fileNames[file.uid];
        }

        // Fallback to existing filename if user has
        // not provided an alternative.
        else {
          file.displayName = stripExt(file.name);
        }
        return file;
      });

      await this.__reset();

      this.fire('update', {files: renamedFiles});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      warn('An error occured while adding files.');
    }
  }


  async open(files) {
    this._files = files;

    await listenOnce(this.$.repeater, 'dom-change');
    await schedule();

    return this.$.modal.open();
  }

}

window.customElements.define(AFSSaveAsModal.is, AFSSaveAsModal);
