
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
  *    item - File data object.
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

      file: Object,
      // File item object.
      item: Object

    };
  }


  static get observers() {
    return [
      '__fileChanged(file)'
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

    return `${type} ● ${sizeStr}`;
  }


  async __fileChanged(file) {
    if (file) {
      await wait(800);
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
      this.fire('remove-file', {item: this.item, target: this});
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }

  // <file-uploader> deleteAll.
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
