

/**
  * `afs-image-editor-reset-modal`
  * 
  *   This ui informs the user that they will lose their work, 
  *   if not saved, and allows them to confirm their choice.
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './afs-image-editor-reset-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import './afs-image-editor-icons.js';


class AFSImageEditorResetModal extends AppElement {
  
  static get is() { return 'afs-image-editor-reset-modal'; }

  static get template() {
    return html([htmlString]);
  }


  async __dismissBtnClicked() {

    try {
      await this.clicked();

      this.$.modal.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __resetBtnClicked() {

    try {

      await this.clicked();

      this.fire('image-editor-reset-modal-reset');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  close() {

    return this.$.modal.close();
  }


  open() {

    return this.$.modal.open();
  }

}

window.customElements.define(AFSImageEditorResetModal.is, AFSImageEditorResetModal);
