
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
  *  
  *    items - Collection of file data objects that drives the template repeater.
  *
  *  
  *
  *
  *  Events:
  *
  *
  *    'delete-item' - Fired after user confirms a delete action on a single item.
  *                    detail: {uid} 
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
  listen,
  unlisten
}                 from '@longlost/utils/utils.js';
import htmlString from './file-list.html';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@longlost/app-icons/app-icons.js';
import '@longlost/badged-icon-button/badged-icon-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/file-icons.js';
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

      // Firestore doc path string.
      doc: String,
      
      // Firestore document field to use for saving file data after processing.
      // ie. 'backgroundImg', 'catImages', ...
      field: String, 

      hideDropzone: Boolean,

      // Drives <template is="dom-repeat">
      items: Array,

      // Disable multi-select action buttons when
      // no items are selected.
      _btnDisabled: {
        type: Boolean,
        value: true,
        computed: '__computeBtnDisabled(_selectedCount)'
      },

      // Enter multi-select action buttons when one
      // or more items are selected.
      _btnEnterClass: {
        type: String,
        value: '',
        computed: '__computeBtnEnterClass(_selectedCount)'
      },   

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true
      },

      // Do no show print icon button unless
      // all items are image files since
      // printJS can only print multiple images
      // on one print job.
      _hidePrintBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHidePrintBtn(items)'
      },

      _selectActiveListenerKey: Object,

      // Display a badge with the selected item count.
      _selectedCount: {
        type: Number,
        value: 0,
        computed: '__computeSelectedCount(_selectedItems)'
      },

      // A cache of multi-selected items.
      _selectedItems: {
        type: Object,
        value: () => ({})
      },

      _showBadge: {
        type: Boolean,
        value: false,
        computed: '__computeShowBadge(_selectedCount)'
      }

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this._selectActiveListenerKey = listen(
      this.select('paper-icon-button', this.$.selectBtn),
      'active-changed',
      this.__selectBtnActiveChanged.bind(this)
    );

    this._itemsSelectedListenerKey = listen(
      this,
      'item-selected',
      this.__itemSelected.bind(this)
    );
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    unlisten(this._selectActiveListenerKey);
    unlisten(this._itemsSelectedListenerKey);
  }


  __computeBtnDisabled(count) {
    return count < 1;
  }


  __computeBtnEnterClass(count) {
    return count > 0 ? 'enter' : '';
  }


  __computeHidePrintBtn(items) {
    if (!items || !Array.isArray(items)) { return true; }

    return items.some(item => !item.type.includes('image'));
  }


  __computeSelectedCount(selected) {
    return Object.keys(selected).length;
  }


  __computeShowBadge(count) {
    return count > 0;
  }


  __itemSelected(event) {
    const {item, selected} = event.detail;
    const {uid} = item;

    if (selected) {
      this._selectedItems = {...this._selectedItems, [uid]: item};
    }
    else {
      delete this._selectedItems[uid];
      this._selectedItems = {...this._selectedItems};
    }
  }


  async __btnClicked(name) {
    try {
      await this.clicked();

      const items = Object.
                      values(this._selectedItems).
                      sort((a, b) => a.index - b.index);

      this.fire(name, {items});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __deleteBtnClicked() {
    this.__btnClicked('request-delete-items');
  }


  __downloadBtnClicked() {
    this.__btnClicked('download-items');
  }


  __printBtnClicked() {
    this.__btnClicked('print-images');
  }


  __selectBtnActiveChanged(event) {
    const {value} = event.detail;

    this._hideCheckboxes = !value;
  }


  cancelDelete() {
    this.$.fileItems.cancelDelete();
  }


  cancelUploads(uids) {
    this.$.fileItems.cancelUploads(uids);
  }


  delete() {
    this._selectedItems = {};
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
