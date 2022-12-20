
/**
  * `afs-roll-item`
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


import {AppElement} from '@longlost/app-core/app-element.js';
import {getBBox}    from '@longlost/app-core/utils.js';
import {ItemMixin}  from './item-mixin.js';
import template     from './afs-roll-item.html';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import '@polymer/paper-ripple/paper-ripple.js';


class AFSRollItem extends ItemMixin(AppElement) {

  static get is() { return 'afs-roll-item'; }

  static get template() { return template; }


  static get properties() {
    return {

      // This items current index.
      index: Number,

      _clicked: Boolean,

      _rippled: Boolean,

      _tabindex: {
        type: Number,
        value: 0,
        computed: '__computeTabindex(hideCheckbox)'
      }

    };
  }


  static get observers() {
    return [
      '__clickedRippledChanged(_clicked, _rippled)'
    ];
  }


  connectedCallback() {

    super.connectedCallback();

    this.$.a11y.target = this.$.wrapper;
  }


  __computeTabindex(hideCheckbox) {

    return hideCheckbox ? 0 : -1;
  }


  __clickedRippledChanged(clicked, rippled) {

    if (clicked && rippled) {
      this.fire('afs-roll-item-open-carousel', {
        index:        this.index,
        item:         this.item, 
        measurements: getBBox(this)
      });

      this._clicked = false;
      this._rippled = false;
    }
  }


  __a11yKeysPressed(event) {

    const {key} = event.detail.keyboardEvent;

    if (key === 'Enter') {
      this.__thumbnailClicked();
    }
  }


  async __thumbnailClicked() {

    try {
      if (this._tabindex === -1) { return; }

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

window.customElements.define(AFSRollItem.is, AFSRollItem);
