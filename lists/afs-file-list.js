
/**
  * `afs-file-list`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  *
  *
  *  Properties:
  *
  *
  *    Inherited from list-overlay-mixin.js
  *
  *  
  *  Methods:
  *
  *
  *   open() - Opens the file list overlay.
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-core/app-element.js';
import {schedule}         from '@longlost/app-core/utils.js';
import {ListOverlayMixin} from './list-overlay-mixin.js';
import htmlString         from './afs-file-list.html';
// 'afs-file-items' lazy loaded after open.


class AFSFileList extends ListOverlayMixin(AppElement) {
  static get is() { return 'afs-file-list'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Overwriting mixin prop value.
      title: {
        type: String,
        value: 'My Files'
      }

    };
  }

  // Overlay 'on-reset' handler.
  __reset() {
    this._opened = false;
  }


  async __open() {

    await schedule();

    await this.$.overlay.open();

    this._opened = true;

    await import(
      /* webpackChunkName: 'afs-file-items' */ 
      './afs-file-items.js'
    );
  }


  open() {
    this._isSelector = false;

    return this.__open();
  }
  

  openSelector() {
    this._isSelector = true;

    return this.__open();
  }

}

window.customElements.define(AFSFileList.is, AFSFileList);
