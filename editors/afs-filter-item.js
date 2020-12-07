

/**
  * `afs-filter-item`
  * 
  *   
  *   A filter preview selectable item.
  *
  *
  *
  *  Properites:
  *
  *
  *     item - Required. Filter item object.    
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
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
import htmlString         from './afs-filter-item.html';
import '@longlost/app-images/lazy-image.js';


class AFSFilerItem extends AppElement {
  static get is() { return 'afs-filter-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object

    };
  }

}

window.customElements.define(AFSFilerItem.is, AFSFilerItem);
