
/**
  * `camera-roll`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  *    doc - <String> required: firestore document path to use when saving.
  *           ie. `${program}`, 'home', `${uid}`
  *           default -> undefined
  *
  *
  *    field - <String> optional: firestore document object field (prop) to save the file metadata/info.
  *            ie. 'backgroundImg', 'carousel', 'profileImg'
  *            default -> 'files'
  *
  *
  *    items - <Array> required: Input items from Firestore db.
  *
  *
  *
  *  Events:         
  *
  *
  *    'item-clicked' - Fired when an item is clicked.
  *                     detail -> {uid} - item uid
  *
  *  
  *  Methods:
  *
  *
  *
  *    cancelDelete() - User dismisses the delete modal in <preview-list> parent element.
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
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
import htmlString from './camera-roll.html';
import './multiselect-btns.js';
import './roll-items.js';


class CameraRoll extends AppElement {
  static get is() { return 'camera-roll'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Firestore coll path string.
      coll: String,

      // Firestore doc path string.
      doc: String,
      
      // Firestore document field to use for saving file data after processing.
      // ie. 'backgroundImg', 'catImages', ...
      field: String,

      // Input items from db.
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


  __overlayTriggered(event) {
    const triggered = event.detail.value;

    if (triggered) {
      this.__hideScale();
    }
    else {
      this.__showScale();
    }
  }


  __hideScale() {
    this.$.scale.classList.add('hide-scale');
  }


  __showScale() {
    this.$.scale.classList.remove('hide-scale');
  }


  __resetScale() {
    this.$.scale.style['display'] = 'none';
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


  cancelUploads(uids) {
    this.$.rollItems.cancelUploads(uids);
  }


  delete() {
    this.$.multi.delete();
  }


  async open() {
    this.$.scale.style['display'] = 'flex';
    await this.$.overlay.open();
    this.__showScale();
  }


}

window.customElements.define(CameraRoll.is, CameraRoll);
