
/**
  * `afs-empty-list-placeholder`
  * 
  *   A simple visual and message to queue user to add files to the parent list. 
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
  *
  *
  *  
  *  Methods:
  *
  *
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
import htmlString         from './afs-empty-list-placeholder.html';
import './afs-list-placeholder-icon.js';


class AFSEmptyListPlaceholder extends AppElement {
  static get is() { return 'afs-empty-list-placeholder'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      hidden: Boolean

    };
  }

}

window.customElements.define(AFSEmptyListPlaceholder.is, AFSEmptyListPlaceholder);
