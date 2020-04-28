

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
  EditorMixin
}                 from './editor-mixin.js';
import {
  schedule
}                 from '@longlost/utils/utils.js';
import htmlString from './file-editor.html';
import '@polymer/paper-fab/paper-fab.js';
import '../shared/file-icons.js';
import '../shared/action-buttons.js';
// Map lazy loaded.


class FileEditor extends EditorMixin(AppElement) {
  static get is() { return 'file-editor'; }

  static get template() {
    return html([htmlString]);
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

      this.fire('open-photo-viewer', {item: this.item});
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


  async __showFab() {
    this.$.fab.style['display'] = 'flex';
    await schedule();
    this.$.fab.classList.add('fab-animation');
  }

  // <app-header-overlay> 'on-overlay-exiting' handler.
  __hideFab() {
    this.$.fab.classList.remove('fab-animation');
  }

  // <app-header-overlay> 'on-reset' handler.
  __resetFab() {

    // Remove the class in case the overlay 
    // is reset programmatically.
    this.$.fab.classList.remove('fab-animation');
    this.$.fab.style['display'] = 'none';
  }


  async open() {
    await  this.$.overlay.open();
    return this.__showFab();
  }

  // Used for confirmed delete actions.
  reset() {
    return this.$.overlay.reset();
  }

}

window.customElements.define(FileEditor.is, FileEditor);
