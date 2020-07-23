
/**
  * `file-sources-upload-actions-card`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html}            from '@longlost/app-element/app-element.js';
import {hijackEvent, schedule, wait} from '@longlost/utils/utils.js';
import htmlString                    from './file-sources-upload-actions-card.html';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-card/paper-card.js';


class FileSourcesUploadActionsCard extends AppElement {
  static get is() { return 'file-sources-upload-actions-card'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      list: String,

      qty: Number,

      _editorType: {
        type: String,
        computed: '__computeEditorType(list)'
      },

      _readyQtyStr: {
        type: String,
        value: '',
        computed: '__computeReadyQtyStr(qty)'
      },

      _renameQtyStr: {
        type: String,
        value: '',
        computed: '__computeRenameQtyStr(qty)'
      },

      _shown: {
        type: Boolean,
        value: false
      }

    };
  }


  __computeEditorType(list) {
    return list === 'files' ? 'file' : 'image';
  }


  __computeReadyQtyStr(qty) {
    if (typeof qty !== 'number' || qty < 1) { return ''; }

    return qty > 1 ? `${qty} files are` : 'Your file is';
  }


  __computeRenameQtyStr(qty) {
    if (typeof qty !== 'number' || qty < 1) { return ''; }

    return qty > 1 ? 'any of these files' : 'this file'
  }


  async __hide() {
    if (!this._shown) { return; }

    this.style['transform'] = 'translateY(100%)';

    await wait(350);

    this._shown           = false;
    this.style['display'] = 'none';

    return schedule();
  }


  async __renameBtnClicked(event) {
    hijackEvent(event);

    try {
      await this.clicked();
      await this.__hide();

      this.fire('rename');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __goBtnClicked(event) {
    hijackEvent(event);

    try {
      await this.clicked();
      await this.__hide();

      this.fire('go');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async nudge() {
    if (!this._shown) { return; }

    this.style['transform'] = 'translateY(-32px)';

    await wait(350);

    this.style['transform'] = 'none';
  }


  async show() {
    if (this._shown) { return; }

    this._shown           = true;
    this.style['display'] = 'block';

    await schedule();

    this.style['transform'] = 'none';
  }

}

window.customElements.define(FileSourcesUploadActionsCard.is, FileSourcesUploadActionsCard);
