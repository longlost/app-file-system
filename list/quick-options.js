
/**
  * `quick-options`
  * 
  *   Convienient options for file types that are not image/video.
  * 	
  * 	Quickly delete/download/print files after clicking on the file item.
  * 	Print will only be displayed for pdf and json files.
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
} 								from '@longlost/app-element/app-element.js';
import {
	isDisplayed, 
	schedule, 
	wait
} 								from '@longlost/utils/utils.js';
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
      item: Object,

    };
  }


  __computePrintBtnHidden(type) {
  	const isPrintable = type && (
  												type.includes('image') ||
  												type.includes('pdf') ||
  												type.includes('json')
  											);

  	return !isPrintable;
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


  async __deleteBtnClicked() {
    try {
      await this.clicked();

      this.fire('request-delete-item', {uid: this.item.uid});
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __downloadBtnClicked() {
    try {
      await this.clicked();

      this.fire('download-item', {item: this.item});
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async __printBtnClicked() {
    try {
      await this.clicked();

      this.fire('print-item', {item: this.item});
    }
    catch (error) { 
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }


  async close() {

  	if (!isDisplayed(this)) { return; }

  	this.$.background.style['opacity'] = '0';
  	this.style['opacity'] 						 = '0';
  	this.style['transform'] 					 = 'scale(0, 0)';
  	await wait(350);
  	this.style['display'] = 'none';
  }


  async open() { 

  	if (isDisplayed(this)) { return; }

  	this.style['display'] = 'flex';
  	await schedule();
  	this.$.background.style['opacity'] = '0.9';
  	this.style['opacity'] 						 = '1';
  	this.style['transform'] 					 = 'scale(1, 1)';
  }

}

window.customElements.define(QuickOptions.is, QuickOptions);
