

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
import {schedule, wait} from '@longlost/utils/utils.js';
import htmlString from './file-editor.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-fab/paper-fab.js';
import '../shared/file-icons.js';
import '../shared/action-buttons.js';


class FileEditor extends PhotoElementMixin(AppElement) {
  static get is() { return 'file-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _controls: {
        type: Boolean,
        value: false
      }

    };
  }


  __computeHeaderSize(isImg, isVid) {
    return isImg || isVid ? 5 : 2;
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


  __reset() {
    this.item = undefined;
  }


  async open(item) {
    this.item = item;
    await this.$.overlay.open();
  }

}

window.customElements.define(FileEditor.is, FileEditor);
