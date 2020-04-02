
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
import '@polymer/paper-ripple/paper-ripple.js';


class RollItem extends ItemMixin(AppElement) {
  static get is() { return 'roll-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _clicked: Boolean,

      _rippled: Boolean

    };
  }


  static get observers() {
    return [
      '__clickedRippledChanged(_clicked, _rippled)'
    ];
  }


  __clickedRippledChanged(clicked, rippled) {

    if (clicked && rippled) {
      this.fire('open-carousel', {
        item:         this.item, 
        measurements: this.getBoundingClientRect()
      });

      this._clicked = false;
      this._rippled = false;
    }
  }


  async __thumbnailClicked() {
    try {
      await this.clicked();

      this._clicked = true;
      this._rippled = false;
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __rippleDone() {
    this._rippled = true;
  }

}

window.customElements.define(RollItem.is, RollItem);
