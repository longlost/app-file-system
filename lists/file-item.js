
/**
  * `file-item`
  * 
  *   File preview item that displays a thumbnail, file stats and upload controls.
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: Firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *    doc - <String> required: Firestore document path to use when saving.
  *           ie. `${program}`, 'home', `${uid}`
  *           default -> undefined
  *
  *
  *    field - <String> optional: Firestore document object field (prop) to save the file metadata/info.
  *            ie. 'backgroundImg', 'carousel', 'profileImg'
  *            default -> 'files'
  *
  *  
  *    item - <Object> required: File item data object.
  *
  *
  *
  *
  *  Methods: 
  *
  *   
  *   cancelUpload - Cancel an item upload mid-stream. Used when an item is deleted early.
  *
  *
  *   pauseUpload - Pause incomplete uploads when user is deciding to delete an item.
  *
  *
  *   resumeUpload - Resume an incomplete upload when a user dismisses the delete modal.
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {formatTimestamp}  from '@longlost/utils/utils.js';
import mime               from 'mime-types';
import htmlString         from './file-item.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/file-thumbnail.js';
import './processing-icon.js';
import './select-checkbox.js';
import './upload-controls.js';
import './quick-options.js';


class FileItem extends AppElement {
  static get is() { return 'file-item'; }

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
      field: {
        type: String,
        value: 'files'
      },

      hideCheckbox: Boolean,
      
      // File item object.
      item: Object,

      // Selected/checked state.
      selected: {
        type: Boolean,
        value: false
      },

      // Style file-thumbnail, label and upload-controls
      // when the item is selected.
      _selectedClass: {
        type: String,
        computed: '__computeSelectedClass(selected)'
      }

    };
  }


  static get observers() {
    return [
      '__hideCheckboxChanged(hideCheckbox)',
      '__itemChanged(item)',
      '__selectedChanged(selected)'
    ];
  }


  __computeOrder(item) {
    if (!item) { return ''; }

    return `${item.index + 1}`;
  }


  __computeStatsLine1(item) {
    if (!item || !item.timestamp) { return ''; }

    return `${formatTimestamp(item.timestamp, 'short')}`;
  }


  __computeStatsLine2(item) {
    if (!item) { return ''; }

    const {type, sizeStr} = item;

    if (!type) { return sizeStr; }

    return `${mime.extension(type)} ● ${sizeStr}`;
  }


  __computeSelectedClass(selected) {
    return selected ? 'selected' : '';
  }


  __hideCheckboxChanged(hide) {
    if (hide) {
      this.selected = false;
    }
    else {
      this.$.options.close();
    }
  }


  __itemChanged() {
    this.selected = false;
  }


  __selectedChanged(selected) {
    this.fire('item-selected', {
      item: this.item, 
      selected
    });
  }

  
  async __moreBtnClicked(event) {
    try {
      if (!this.hideCheckbox) { return; }

      await this.clicked();

      this.$.options.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __itemClicked(event) {
    try {
      if (this.hideCheckbox) { return; }

      await this.clicked();
      
      this.selected = !this.selected;
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // Used for app-file-system.js deleteAll() method.
  cancelUpload() {
    this.$.uploadControls.cancel();
  }


  pauseUpload() {
    this.$.uploadControls.pause();
  }


  resumeUpload() {
    this.$.uploadControls.resume();
  }

}

window.customElements.define(FileItem.is, FileItem);
