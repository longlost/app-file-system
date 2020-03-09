
/**
  * `paginated-roll-items`
  * 
  *   Paginates photo items from db as user scrolls.
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
import htmlString         from './paginated-roll-items.html';
import './roll-item.js';


class PaginatedRollItems extends PaginationMixin(AppElement) {
  static get is() { return 'paginated-roll-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Overwrite PaginationMixin inherited prop.
      _type: {
        type: String,
        value: 'photo'
      }

    };
  }

}

window.customElements.define(PaginatedRollItems.is, PaginatedRollItems);
