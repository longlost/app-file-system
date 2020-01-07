

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
import htmlString from './file-editor.html';
import '@longlost/app-header-overlay/app-header-overlay.js';



class FileEditor extends AppElement {
  static get is() { return 'file-editor'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      

    };
  }



  open() {
    return this.$.overlay.open();
  }

}

window.customElements.define(FileEditor.is, FileEditor);
