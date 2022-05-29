
/**
  * `afs-action-buttons`
  * 
  *   File action buttons.
  *   
  *   Quickly delete/download/print files.
  *   Print will only be displayed for image, html, pdf and json files.
  *
  *
  *
  *  Properites:
  *
  *  
  *    item - <Object> required: File item data object.
  *
  *
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './afs-action-buttons.html';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/afs-file-icons.js';


class AFSActionButtons extends AppElement {

  static get is() { return 'afs-action-buttons'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {
      
      // File item object.
      item: Object,

      editButton: {
        type: Boolean,
        value: false
      },

      _disabled: {
        type: Boolean,
        value: true,
        computed: '__computeDisabled(item)'
      },

      _downloadBtnDisabledClass: {
        type: String,
        value: 'disabled',
        computed: '__computeDownloadBtnDisabledClass(item)'
      },

      _hidePrintBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHidePrintBtn(item.type)'
      }

    };
  }


  __computeDisabled(item) {

    return !Boolean(item);
  }


  __computeDownloadBtnDisabledClass(item) {

    return !item || !item.original ? 'disabled' : '';
  }


  __computeDownloadUrl(original) {

    return original ? original : '#';
  }


  __computeHidePrintBtn(type) {

    const isPrintable = type && (
                          type.includes('html')  ||
                          type.includes('image') ||
                          type.includes('json')  ||
                          type.includes('pdf')   ||
                          type.includes('video')
                        );

    return !isPrintable;
  }


  async __optionBtnClicked(name) {

    try {
      await this.clicked();

      this.fire(name, {item: this.item});
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  __deleteBtnClicked() {

    this.__optionBtnClicked('request-delete-item');
  }


  __printBtnClicked() {

    this.__optionBtnClicked('print-item');
  }


  __shareBtnClicked() {

    this.__optionBtnClicked('share-item');
  }


  __editBtnClicked() {
    
    this.__optionBtnClicked('edit-file');
  }

}

window.customElements.define(AFSActionButtons.is, AFSActionButtons);
