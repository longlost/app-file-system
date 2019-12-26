
/**
  * `preview-item`
  * 
  *   File preview item that displays a thumbnail, file stats and upload controls.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
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
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  formatTimestamp,
  schedule,
  wait
}                 from '@longlost/utils/utils.js';
import mime       from 'mime-types';
import htmlString from './preview-item.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '../shared/file-thumbnail.js';
import './processing-icon.js';
import './upload-controls.js';


class PreviewItem extends AppElement {
  static get is() { return 'preview-item'; }

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
      
      // File item object.
      item: Object

    };
  }


  static get observers() {
    return [
      '__fileChanged(item.file)'
    ];
  }


  __computeStatsLine1(item) {
    if (!item) { return ''; }

    const {index, timestamp} = item;
    const order              = `#${index + 1}`;

    if (!timestamp) { return order; }

    return `${order} ● ${formatTimestamp(timestamp, 'short')}`;
  }


  __computeStatsLine2(item) {
    if (!item) { return ''; }

    const {type, sizeStr} = item;

    if (!type) { return sizeStr; }

    return `${mime.extension(type)} ● ${sizeStr}`;
  }


  async __fileChanged(file) {

    if (file) {
      await wait(800);

      // If processing happens faster than animation timing, abort.
      if (!file) { return; }

      this.$.uploadControls.style['display'] = 'flex';
      await schedule();
      this.$.uploadControls.classList.remove('hide');
    }
    else {
      this.$.uploadControls.classList.add('hide');
      await wait(350);
      this.$.uploadControls.style['display'] = 'none';
    }
  }

  // file ui x button clicked
  async __removeFileButtonClicked() {
    try {
      await this.clicked();

      this.pauseUpload();

      this.fire('request-delete-item', {uid: this.item.uid});
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

window.customElements.define(PreviewItem.is, PreviewItem);
