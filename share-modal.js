

/**
  * `share-modal`
  * 
  *   Displays a shareable link for a given file.  
  *   Allows user to easily save link to clipboard.
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
import {
  message,
  schedule,
  warn
}                 from '@longlost/utils/utils.js';
import services   from '@longlost/services/services.js';
import htmlString from './share-modal.html';
import '@longlost/app-overlays/app-modal.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './shared/file-icons.js';


class ShareModal extends AppElement {
  static get is() { return 'share-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      _hideCopyBtn: {
        type: Boolean,
        value: true
      },

      _isOpen: Boolean,

      _shareLink: String

    };
  }


  static get observers() {
    return [
      '__itemChanged(item, _isOpen)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    if ('clipboard' in navigator) {
      this._hideCopyBtn = false;
    }
  }


  async __itemChanged(item, isOpen) {
    try {

      if (!isOpen) { return; }

      const {field, path, shareable, sharePath, type, uid} = item;

      if (sharePath) {
        if (shareable) {

          this._shareLink = await services.getDownloadUrl(sharePath);

          this.$.spinner.hide();          
        }
        else {
          const metadata = await services.getMetadata(sharePath);

          const newMetadata = {...metadata, contentDisposition: 'inline'};

          await services.updateMetadata(sharePath, newMetadata);

          this.fire('update-item', {item: {...item, shareable: true}});
        }
      }
      else if (type.includes('image')) {
        this.$.spinner.show('Image processing.');
      }
      else {
        services.cloudFunction({
          data: {
            field,
            path, 
            type,
            uid
          },
          name: 'createShareable'
        });
      }
    }
    catch (error) {
      console.error(error);
      await warn('An error occured while creating the link.');
      this.__close();
    }
  }


  async __copyBtnClicked() {
    try {

      if (!this._shareLink) { return; }

      await this.clicked();

      await navigator.clipboard.writeText(this._shareLink);

      message('Link copied to your clipboard.');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      warn('Could not copy the link.');
    }
  }


  async __dismissBtnClicked() {
    try {
      await this.clicked();
      this.__close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __close() {
    this._isOpen = false;
    this.$.spinner.hide();
    this.$.modal.close();
  }


  async open(item) {
    this.$.spinner.show('Creating your link.');
    await schedule();
    await this.$.modal.open();
    this._isOpen = true;
  }

}

window.customElements.define(ShareModal.is, ShareModal);
