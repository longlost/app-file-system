

/**
  * `save-as-modal-input-item`
  * 
  *   File thumbnail and file name input repeated item.
  *
  *
  *   
  *
  *
  *
  *
  *  Properites:
  *
  *
  * 
  *
  *
  *  Events:
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
} from '@longlost/app-element/app-element.js';

import {hijackEvent} from '@longlost/utils/utils.js';
import {stripExt} 	 from '../shared/utils.js';
import htmlString 	 from './save-as-modal-input-item.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-input/paper-input.js';
import '../shared/file-thumbnail.js';


class SaveAsModalInputItem extends AppElement {
  static get is() { return 'save-as-modal-input-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object

    };
  }
  

  __computePlaceholderName(name) {
    return stripExt(name);
  }


  async __thumbnailClicked() {
  	try {
  		await this.clicked();

  		this.$.input.focus();
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  	}
  }


  __valueChanged(event) {
  	hijackEvent(event);
    
    const {value} = event.detail;

    this.fire('input-item-value-changed', {
    	uid: 	 this.item.uid,
    	value: value.trim()
    });
  }

}

window.customElements.define(SaveAsModalInputItem.is, SaveAsModalInputItem);
