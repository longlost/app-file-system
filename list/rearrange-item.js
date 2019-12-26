
/**
  * `rearrange-item`
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


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {formatTimestamp}  from '@longlost/utils/utils.js';
import mime               from 'mime-types';
import htmlString         from './rearrange-item.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '../shared/file-thumbnail.js';
import './processing-icon.js';
import './upload-controls.js';


class RearrangeItem extends AppElement {
  static get is() { return 'rearrange-item'; }

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



  // // file ui x button clicked
  // async __removeFileButtonClicked() {
  //   try {
  //     await this.clicked();

  //     this.pauseUpload();

  //     this.fire('request-delete-item', {uid: this.item.uid});
  //   }
  //   catch (error) { 
  //     if (error === 'click debounced') { return; }
  //     console.error(error); 
  //   }
  // }





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

window.customElements.define(RearrangeItem.is, RearrangeItem);
