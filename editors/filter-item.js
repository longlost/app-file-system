

/**
  * `filter-item`
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


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString 				from './filter-item.html';
import '@longlost/app-images/lazy-image.js';


class ImageFilters extends AppElement {
  static get is() { return 'filter-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object

    };
  }

}

window.customElements.define(ImageFilters.is, ImageFilters);
