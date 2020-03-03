
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
  *    items - <Array> required: Input items from Firestore db.
  *
  *
  *
  *
  *  
  *  Methods:
  *
  *
  *
  *    delete() - Clears multiselect after a delete operation.
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
  unlisten,
  wait
}                 from '@longlost/utils/utils.js';
import services   from '@longlost/services/services.js';
import htmlString from './camera-roll.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
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

      // Input items from db.
      files: Array,

      // Data-bound to <file-items>.
      // All item checkboxes selected when true.
      _all: {
        type: Boolean,
        value: false
      },

      // Drives <template is="dom-repeat">
      _combinedFileItems: {
        type: Array,
        computed: '__computeCombinedFileItems(_items, files)'
      },

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true
      },  

      // Input items from db.
      _items: Array,

      // This default is overridden by localstorage 
      // after initial interaction from user.
      _scale: {
        type: Number,
        value: 50
      },

      // Services/Firestore subscription unsubscribe function.
      _unsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__collChanged(coll)',
      '__itemsChanged(_items)',
    ];
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
    this.__unsub();
  }

  // Combine incomming file obj with db item.
  // File obj is fed to <upload-controls>.
  __computeCombinedFileItems(items, files) {

    if (!items || items.length === 0) { return; }
    if (!files || Object.keys(files).length === 0) { return items; }

    const fileItems = items.map(item => {

      const match = files[item.uid];

      if (!match) {
        // Remove file prop.
        const {file, ...rest} = item; 
        return {...rest};
      }
      // Add file to item.
      return {...item, file: match};
    });

    return fileItems;
  }

  // Start a subscription to file data changes.
  async __collChanged(coll) {
    if (!coll) { return; }

    if (this._unsubscribe) {
      this._unsub();
    }
    else { 

      // App is still initializing, 
      // so give <app-settings> time to call enablePersistence
      // on services before calling subscribe.
      await wait(500);
    }


    const callback = results => {

      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      this._items = results.
                      filter(obj => obj.uid);
    };


    const errorCallback = error => {
      this._items  = undefined;

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };


    this._unsubscribe = services.subscribe({
      callback,
      coll,
      errorCallback,
      orderBy: {
        prop:      'timestamp',
        direction: 'desc'
      }
    });
  }

  // Fire up to top level to create _dbData.
  __itemsChanged(items) {
    this.fire('items-changed', {value: items});
  }


  __unsub() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }


  __localstorageDataChanged(event) {
    this._scale = event.detail.value;
  }


  __overlayTriggered(event) {
    const triggered = event.detail.value;

    // Noop on overlay initialization during first open.
    if (!this.$.overlay.header) { return; }

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


  __sliderValChanged(event) {
    this._scale = event.detail.value;
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
