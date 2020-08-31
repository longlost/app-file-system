

/**
  * `afs-image-editor-save-modal`
  * 
  *   This ui displays a preview of the image that is to be saved and
  *   gives the user the option to save the file or dismiss the modal.
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
}                 from '@longlost/app-element/app-element.js';
import htmlString from './afs-image-editor-save-modal.html';
import '@longlost/app-images/lazy-image.js';
import '@longlost/app-overlays/app-modal.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import './afs-image-editor-icons.js';


class AFSImageEditorSaveModal extends AppElement {
  static get is() { return 'afs-image-editor-save-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      src: String,

      _dismissBtnLabel: {
        type: String,
        value: 'DISMISS',
        computed: '__computeDismissBtnLabel(_unsaved)'
      },

      _unsaved: {
        type: Boolean,
        value: false
      },

    };
  }


  __computeDismissBtnLabel(unsaved) {
    return unsaved ? `DON'T SAVE` : 'DISMISS';
  }


  async __dismissBtnClicked() {
    try {
      await this.clicked();
      await this.$.modal.close();

      if (this._unsaved) {
        this._unsaved = false;
        this.fire('image-editor-save-modal-close');
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __saveBtnClicked() {
    try {

      await this.clicked();

      await this.$.modal.close();

      if (this._unsaved) {
        this._unsaved = false;
        this.fire('image-editor-save-modal-save-close');
      }
      else {
        this.fire('image-editor-save-modal-save');
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {
    this._unsaved = false;

    return this.$.modal.open();
  }


  openUnsaved() {
    this._unsaved = true;

    return this.$.modal.open();
  }

}

window.customElements.define(AFSImageEditorSaveModal.is, AFSImageEditorSaveModal);
