
/**
  * `carousel-item`
  * 
  *   Image or video element that is displayed in a carousel view.
  *
  *
  *
  *  Properites:
  *
  *  
  *   item - File data object.
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html}  from '@longlost/app-element/app-element.js';
import {PhotoElementMixin} from '../shared/photo-element-mixin.js';
import htmlString          from './carousel-item.html';


class CarouselItem extends PhotoElementMixin(AppElement) {
  static get is() { return 'carousel-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      index: Number,

      reverse: Boolean

    };
  }


  static get observers() {
    return [
      '__indexReverseChanged(index, reverse)'
    ];
  }

  // Reverses the css flex order so added/removed
  // items are automatically right-to-left order.
  //
  // This is a performance enhancment compared to
  // using a sort function on the parent dom-repeat 
  // template since such a function would have to 
  // run over all elements in the template for every
  // change in the dom.
  __indexReverseChanged(index, reverse) {
    if (!index || !reverse) { return; }

    this.style['order'] = `-${index}`;
  }

}

window.customElements.define(CarouselItem.is, CarouselItem);
