
/**
  * `afs-file-list`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  *
  *
  *  Properites:
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


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {ListOverlayMixin} from './list-overlay-mixin.js';
import htmlString         from './afs-file-list.html';
// 'afs-file-items' lazy loaded after open.


class AFSFileList extends ListOverlayMixin(AppElement) {
  static get is() { return 'afs-file-list'; }

  static get template() {
    return html([htmlString]);
  }

  // Overlay 'on-reset' handler.
  __reset() {
    this._opened = false;
  }


  async open() {
    await this.$.overlay.open();

    this._opened = true;

    await import(
      /* webpackChunkName: 'afs-file-items' */ 
      './afs-file-items.js'
    );
  }

}

window.customElements.define(AFSFileList.is, AFSFileList);
