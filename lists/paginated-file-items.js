
/**
  * `paginated-file-items`
  * 
  *   Paginates file items from db as user scrolls.
  *
  *
  *   @implements PaginationMixin
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {PaginationMixin}  from './pagination-mixin.js';
import htmlString         from './paginated-file-items.html';
import './file-item.js';


class PaginatedFileItems extends PaginationMixin(AppElement) {
  static get is() { return 'paginated-file-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _correctedStateItems: Array,

    };
  }


  static get observers() {
    return [
      '__itemsChanged(_items)'
    ];
  }


  __itemsChanged(items) {
    if (!items) { return; }

    if (!Array.isArray(this._state) || this._state.length === 0) { 

      this._correctedStateItems = items; 
    }
    else {

      this._correctedStateItems = this._state.map(uid => 
        items.find(item => item.uid === uid));
    }    
  }

}

window.customElements.define(PaginatedFileItems.is, PaginatedFileItems);
