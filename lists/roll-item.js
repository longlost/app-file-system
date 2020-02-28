
/**
  * `roll-item`
  * 
  *   Photo/video camera-roll list item.
  *
  *
  * @implements ItemMixin
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                  from '@longlost/app-element/app-element.js';
import {ItemMixin} from './item-mixin.js';
import htmlString  from './roll-item.html';


class RollItem extends ItemMixin(AppElement) {
  static get is() { return 'roll-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      
      // File item object.
      item: Object

    };
  }

}

window.customElements.define(RollItem.is, RollItem);
