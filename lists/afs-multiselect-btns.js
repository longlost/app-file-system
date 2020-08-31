
/**
  * `afs-multiselect-btns`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  *
  *
  *  Properites:
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
  *    'request-delete-items' - Fired when user clicks the delete btn.
  *                             detail: {items} 
  *
  *
  *    'download-items' - Fired when user clicks the download btn.
  *                             detail: {items} 
  *
  *
  *    'pring-items' - Fired when user clicks the print btn.
  *                             detail: {items} 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString         from './afs-multiselect-btns.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/badged-icon-button/badged-icon-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/afs-file-icons.js';


class AFSMultiselectBtns extends AppElement {
  static get is() { return 'afs-multiselect-btns'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      data: Object,

      // All item checkboxes selected when true.
      _all: {
        type: Boolean,
        value: false,
        computed: '__computeAll(_state)'
      },

      // Disable multi-select action buttons when
      // no items are selected.
      _btnDisabled: {
        type: Boolean,
        value: true,
        computed: '__computeBtnDisabled(_count)'
      },

      // Enter multi-select action buttons when one
      // or more items are selected.
      _btnEnterClass: {
        type: String,
        value: '',
        computed: '__computeBtnEnterClass(_count)'
      },   

      // Display a badge with the selected item count.
      _count: {
        type: Number,
        value: 0,
        computed: '__computeCount(_selectedItems)'
      },

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true,
        computed: '__computeHideCheckboxes(_state)'
      },

      // Do no show print icon button unless
      // all items are image files since
      // printJS can only print multiple images
      // on one print job.
      _hidePrintBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHidePrintBtn(_items)'
      },

      // Do not show multi-select icon button when there are no items.
      _hideSelectBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideSelectBtn(_items)'
      },      

      _items: {
        type: Array,
        computed: '__computeItems(data)'
      },

      // A cache of multi-selected items.
      _selectedItems: {
        type: Object,
        value: () => ({})
      },

      // Select icon button tri-state.
      _state: {
        type: String,
        value: 'none' // Or 'multi', or 'all'.
      },

      _showAllBadge: {
        type: Boolean,
        value: false,
        computed: '__computeShowAllBadge(_count, _items)'
      },

      _showCountBadge: {
        type: Boolean,
        value: false,
        computed: '__computeShowCountBadge(_count)'
      }

    };
  }


  static get observers() {
    return [
      '__allChanged(_all)',
      '__hideCheckboxesChanged(_hideCheckboxes)'
    ];
  }


  __computeAll(state) {
    return state === 'all';
  }


  __computeBtnDisabled(count) {
    return count < 1;
  }


  __computeBtnEnterClass(count) {
    return count > 0 ? 'enter' : '';
  }


  __computeCount(selected) {
    return Object.keys(selected).length;
  }


  __computeHideCheckboxes(state) {
    return state === 'none';
  }


  __computeHidePrintBtn(items) {
    if (!Array.isArray(items)) { return true; }

    // All images and videos which have a poster image.
    const show = items.some(item => (
      item.type.includes('image') ||
      (item.type.includes('video') && item.poster)
    ));

    return !show;
  }


  __computeHideSelectBtn(items) {
    return !Array.isArray(items) || items.length === 0;
  }


  __computeItems(data) {
    if (!data) { return; }

    return Object.values(data);
  }


  __computeShowAllBadge(count, items) {
    if (!Array.isArray(items)) { return false; }

    return count === items.length;
  }


  __computeShowCountBadge(count) {
    return count > 0;
  }


  __allChanged(value) {
    this.fire('all-changed', {value});
  }


  __hideCheckboxesChanged(value) {
    this.fire('hide-checkboxes-changed', {value});
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

      switch (this._state) {
        case 'none':
          this._state = 'multi';
          break;
        case 'multi':
          this._state = 'all';
          break;
        case 'all':
          this._state = 'none';
          break;
        default:
          throw new Error('_state does not have a valid value.');
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  delete() {
    this._selectedItems = {};
    this._state         = 'none';
  }


  selected(item) {
    this._selectedItems = {...this._selectedItems, [item.uid]: item};
  }


  unselected(item) {
    delete this._selectedItems[item.uid];
    this._selectedItems = {...this._selectedItems};
  }

}

window.customElements.define(AFSMultiselectBtns.is, AFSMultiselectBtns);
