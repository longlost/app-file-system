
/**
  * `quick-options`
  * 
  *   Convienient options for file types that are not image/video.
  *   
  *   Quickly delete/download/print files after clicking on the file item.
  *   Print will only be displayed for pdf and json files.
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


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  isDisplayed, 
  schedule, 
  wait
}                 from '@longlost/utils/utils.js';
import htmlString from './quick-options.html';
import '@longlost/app-icons/app-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/file-icons.js';


class QuickOptions extends AppElement {
  static get is() { return 'quick-options'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      
      // File item object.
      item: Object

    };
  }


  static get observers() {
    return [
      '__itemChanged(item)'
    ];
  }


  __computeDownloadBtnDisabledClass(item) {
    return !item || !item.original ? 'disabled' : '';
  }


  __computeDownloadUrl(original) {
    return original ? original : '#';
  }


  __computePrintBtnHidden(type) {
    const isPrintable = type && (
                          type.includes('html') ||
                          type.includes('image') ||
                          type.includes('json') ||
                          type.includes('pdf')
                        );

    return !isPrintable;
  }

  // Since the parent <template is="dom-repeat">
  // reuses elements, close when the data changes.
  // This happens during a delete or adding new files.
  __itemChanged(item) {
    if (!item) { return; }

    this.close();
  }


  async __closeBtnClicked() {
    try {
      await this.clicked();

      this.close();
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
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


  async close() {

    if (!isDisplayed(this)) { return; }

    this.$.background.style['opacity'] = '0';
    this.style['opacity']              = '0';
    this.style['transform']            = 'scale(0, 0)';
    await wait(350);
    this.style['display'] = 'none';
  }


  async open() { 

    if (isDisplayed(this)) { return; }

    this.style['display'] = 'flex';
    await schedule();
    this.$.background.style['opacity'] = '0.9';
    this.style['opacity']              = '1';
    this.style['transform']            = 'scale(1, 1)';
  }

}

window.customElements.define(QuickOptions.is, QuickOptions);
