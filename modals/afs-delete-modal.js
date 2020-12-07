

/**
  * `afs-delete-modal`
  * 
  *   This UI modal asks the user to confirm delete actions,
  *   in an attempt to mitigate accidental taps of delete buttons.
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
  schedule
} from '@longlost/app-core/utils.js';

import htmlString from './afs-delete-modal.html';
import '@longlost/app-core/app-shared-styles.js';
import '@longlost/app-overlays/app-modal.js';
import '@polymer/paper-button/paper-button.js';
import '../shared/afs-file-thumbnail.js';


class AFSDeleteModal extends AppElement {
  static get is() { return 'afs-delete-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _items: Array

    };
  }


  async __deleteBtnClicked(event) {
    hijackEvent(event);

    try {
      await this.clicked();
      await this.$.modal.close();

      this._items = undefined;

      this.fire('delete');
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

      this._items = undefined;

      this.fire('canceled');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open(items) {
    this._items = items;

    await listenOnce(this.$.repeater, 'dom-change');
    await schedule();

    return this.$.modal.open();
  }

}

window.customElements.define(AFSDeleteModal.is, AFSDeleteModal);
