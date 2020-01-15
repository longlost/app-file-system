

/**
  * `file-editor`
  * 
  *   Update file displayName, add notes and keywords.
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
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *    open()
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
  PhotoElementMixin
}                 from '../shared/photo-element-mixin.js';
import htmlString from './file-editor.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-fab/paper-fab.js';
import '../shared/file-icons.js';
import '../shared/action-buttons.js';
import './metadata-editor.js';


class FileEditor extends PhotoElementMixin(AppElement) {
  static get is() { return 'file-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Pass through to <metadata-editor>
      list: String,

      _controls: {
        type: Boolean,
        value: false
      },

      _editedDisplayName: String,

      _title: {
        type: String,
        computed: '__computeTitle(item.displayName, _editedDisplayName)'
      }

    };
  }


  __computeHeaderSize(isImg, isVid) {
    return isImg || isVid ? 5 : 2;
  }


  __computeTitle(displayName, editedDisplayName) {
    return editedDisplayName ? editedDisplayName : displayName;
  }


  __computeHideLaunchBtn(isImg, isVid) {
    return !isImg && !isVid;
  }


  async __launchBtnClicked() {
    try {
      await this.clicked();

      this.fire('open-carousel', {item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __displayNameChanged(event) {
    this._editedDisplayName = event.detail.value;
  }


  async __fabClicked() {
    try {
      await this.clicked();

      this.fire('edit-image', {item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  open() {
    return this.$.overlay.open();
  }

  // Used for confirmed delete actions.
  reset() {
    return this.$.overlay.reset();
  }

}

window.customElements.define(FileEditor.is, FileEditor);
