
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
  *    files - Collection of file data objects that are combined with database items.
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
  unlisten,
  wait
}                 from '@longlost/utils/utils.js';
import services   from '@longlost/services/services.js';
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

      data: Object,

      hideDropzone: Boolean,

      files: Object,

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
      // Items from the database may have sparse index values
      // caused by deleted items, so collapse indexes.
      this._items = results.
                      filter(obj => obj.uid).
                      map((item, index) => ({...item, index}));
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
        prop:      'index',
        direction: 'asc'
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
