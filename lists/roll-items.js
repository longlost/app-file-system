

/**
  * `roll-items`
  * 
  *   Accepts photos and videos from user and handles 
  *   uploading/saving/optimization/deleting/previewing.
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
  *
  *    files - <Object> required: File objects data bound from <file-sources>.
  *
  *
  *                                   
  *
  *  
  *  Methods:
  *
  *
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {scale}    from '@longlost/lambda/lambda.js';
import htmlString from './roll-items.html';
import './paginated-roll-items.js';

// args -> inputMin, inputMax, outputMin, outputMax, input.
const thumbnailScaler = scale(0, 100, 72, 148);


class RollItems extends AppElement {
  static get is() { return 'roll-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // From tri-state multiselect-btns.
      // Select all item checkboxes when true.
      all: Boolean,

      // Firestore coll path string.
      coll: String,

      // Set to true to hide <file-item> <select-checkbox>'s
      hideCheckboxes: Boolean,

      // File objects data bound from <file-sources>.
      files: Object,

      // From 0 to 100.
      scale: Number,

      // Last snapshot doc from each pagination.
      // Drives outer template repeater.
      _paginations: {
        type: Array,
        value: [null]
      }

    };
  }


  static get observers() {
    return [
      '__scaleChanged(scale)'
    ];
  }


  __newPaginationDoc(event) {
    const {doc, index} = event.detail;

    // Add/replace current pagination 
    // doc into paginations array.
    this.splice('_paginations', index + 1, 1, doc);
  }


  __scaleChanged(scale) {
    if (typeof scale !== 'number') { return; }

    const size = thumbnailScaler(scale);

    this.updateStyles({'--thumbnail-size': `${size}px`});
  }


  cancelUploads(uids) {
    const elements = this.selectAll('.item');

    elements.forEach(element => {
      element.cancelUploads();
    });
  }

}

window.customElements.define(RollItems.is, RollItems);
