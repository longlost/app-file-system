

/**
  * `afs-confirm-selection-modal`
  * 
  *   This UI modal asks the user to confirm file item selection actions,
  *   in an attempt to mitigate accidental taps of file list items.
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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  schedule
} from '@longlost/app-core/utils.js';

import template from './afs-confirm-selection-modal.html';
import '@longlost/app-core/app-shared-styles.css';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/afs-file-thumbnail.js';


class AFSConfirmSelectionModal extends AppElement {
  
  static get is() { return 'afs-confirm-selection-modal'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _item: Object

    };
  }


  async __confirmBtnClicked(event) {

    hijackEvent(event);

    try {
      await this.clicked();
      await this.$.modal.close();

      this._item = undefined;

      this.fire('selection-confirmed');
    }
    catch (error) {
      if (error === 'click disabled') { return; }
      console.error(error);
    }
  }


  async __dismissBtnClicked(event) {

    hijackEvent(event);

    try {
      await this.clicked();
      await this.$.modal.close();

      this._item = undefined;

      this.fire('selection-dismissed');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open(item) {

    this._item = item;

    await schedule();

    return this.$.modal.open();
  }

}

window.customElements.define(AFSConfirmSelectionModal.is, AFSConfirmSelectionModal);
