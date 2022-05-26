

/**
  * `afs-save-as-modal-input-item`
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import {hijackEvent}      from '@longlost/app-core/utils.js';
import {stripExt}         from '@longlost/app-core/file-utils.js';
import htmlString         from './afs-save-as-modal-input-item.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/paper-input/paper-input.js';
import '../shared/afs-file-thumbnail.js';


class AFSSaveAsModalInputItem extends AppElement {
  
  static get is() { return 'afs-save-as-modal-input-item'; }

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

  // WARNING!! 
  // Cannot use await this.clicked() here!
  // Doing so will trigger the keyboard on mobile.
  // Focus MUST be called immediately in a click
  // handler for this to work as intended.
  __thumbnailClicked() {

    this.$.input.focus();
  }


  __valueChanged(event) {

    hijackEvent(event);
    
    const {value} = event.detail;

    this.fire('input-item-value-changed', {
      uid:   this.item.uid,
      value: value.trim()
    });
  }

}

window.customElements.define(AFSSaveAsModalInputItem.is, AFSSaveAsModalInputItem);
