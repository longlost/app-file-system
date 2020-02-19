
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
  hijackEvent,
  listen,
  unlisten
}                 from '@longlost/utils/utils.js';
import htmlString from './file-list.html';
import '@longlost/app-overlays/app-header-overlay.js';
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
        value: true,
        computed: '__computeHideCheckboxes(_selectState)'
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

      // Do not show multi-select icon button when there are no items.
      _hideSelectBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideSelectBtn(items)'
      },

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

      // Data-bound to <file-items>.
      // All item checkboxes selected when true.
      _selectAll: {
        type: Boolean,
        value: false,
        computed: '__computeSelectAll(_selectState)'
      },

      // Select icon button tri-state.
      _selectState: {
        type: String,
        value: 'none' // Or 'multi', or 'all'.
      },

      _showAllBadge: {
        type: Boolean,
        value: false,
        computed: '__computeShowAllBadge(_selectedCount, items)'
      },

      _showCountBadge: {
        type: Boolean,
        value: false,
        computed: '__computeShowCountBadge(_selectedCount)'
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


  __computeBtnDisabled(count) {
    return count < 1;
  }


  __computeBtnEnterClass(count) {
    return count > 0 ? 'enter' : '';
  }


  __computeHideCheckboxes(selectState) {
    return selectState === 'none';
  }


  __computeHidePrintBtn(items) {
    if (!Array.isArray(items)) { return true; }

    return items.some(item => !item.type.includes('image'));
  }


  __computeHideSelectBtn(items) {
    return !Array.isArray(items) || items.length === 0;
  }


  __computeSelectAll(selectState) {
    return selectState === 'all';
  }


  __computeSelectedCount(selected) {
    return Object.keys(selected).length;
  }


  __computeShowAllBadge(count, items) {
    if (!Array.isArray(items)) { return false; }

    return count === items.length;
  }


  __computeShowCountBadge(count) {
    return count > 0;
  }


  __itemSelected(event) {
    hijackEvent(event);

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


  async __selectBtnClicked() {
    try {
      await this.clicked();

      switch (this._selectState) {
        case 'none':
          this._selectState = 'multi';
          break;
        case 'multi':
          this._selectState = 'all';
          break;
        case 'all':
          this._selectState = 'none';
          break;
        default:
          throw new Error('_selectState does not have a valid value.');
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
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
