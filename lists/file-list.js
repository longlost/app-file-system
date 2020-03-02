
/**
  * `file-list`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *  
  *    items - Collection of file data objects that drives the template repeater.
  *
  *  
  *
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  hijackEvent,
  listen,
  unlisten
}                 from '@longlost/utils/utils.js';
import htmlString from './file-list.html';
import '@longlost/app-overlays/app-header-overlay.js';
import './multiselect-btns.js';
import './file-items.js';


class FileList extends AppElement {
  static get is() { return 'file-list'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Firestore coll path string.
      coll: String,

      hideDropzone: Boolean,

      // Drives <template is="dom-repeat">
      items: Array,

      // Data-bound to <file-items>.
      // All item checkboxes selected when true.
      _all: {
        type: Boolean,
        value: false
      },

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true
      }

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this._itemsSelectedListenerKey = listen(
      this,
      'item-selected',
      this.__itemSelected.bind(this)
    );
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    unlisten(this._itemsSelectedListenerKey);
  }


  __allChanged(event) {
    this._all = event.detail.value;
  }


  __hideCheckboxesChanged(event) {
    this._hideCheckboxes = event.detail.value;
  }


  __itemSelected(event) {
    hijackEvent(event);

    const {item, selected} = event.detail;

    if (selected) {
      this.$.multi.selected(item);
    }
    else {
      this.$.multi.unselected(item);
    }
  }


  cancelDelete() {
    this.$.fileItems.cancelDelete();
  }


  cancelUploads(uids) {
    this.$.fileItems.cancelUploads(uids);
  }


  delete() {
    this.$.multi.delete();
    this.$.fileItems.delete();
  }


  open() {
    return this.$.overlay.open();
  }


  resetDeleteTarget() {
    this.$.fileItems.resetDeleteTarget();
  }

}

window.customElements.define(FileList.is, FileList);
