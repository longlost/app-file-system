

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
import {schedule} from '@longlost/utils/utils.js';
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

    };
  }



  async open(item) {
    this.item = item;
    await schedule();
    return this.$.overlay.open();
  }

}

window.customElements.define(FileEditor.is, FileEditor);
