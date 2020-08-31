

/**
  * `afs-roll-items`
  * 
  *   Photo items list.
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
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {ItemsMixin}       from './items-mixin.js';
import {scale}            from '@longlost/lambda/lambda.js';
import htmlString         from './afs-roll-items.html';
import './afs-paginated-roll-items.js';


// args -> inputMin, inputMax, outputMin, outputMax, input.
const thumbnailScaler = scale(0, 100, 72, 148);


class AFSRollItems extends ItemsMixin(AppElement) {
  static get is() { return 'afs-roll-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // From 0 to 100.
      scale: Number

    };
  }


  static get observers() {
    return [
      '__scaleChanged(scale)'
    ];
  }


  __scaleChanged(scale) {
    if (typeof scale !== 'number') { return; }

    const size = thumbnailScaler(scale);

    this.updateStyles({'--thumbnail-size': `${size}px`});
  }

}

window.customElements.define(AFSRollItems.is, AFSRollItems);
