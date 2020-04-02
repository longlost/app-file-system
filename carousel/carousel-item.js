
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

}

window.customElements.define(CarouselItem.is, CarouselItem);
