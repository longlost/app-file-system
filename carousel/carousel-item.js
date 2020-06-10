
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
import {getBBox, naturals} from '@longlost/utils/utils.js';
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

      reverse: Boolean,

      _trigger: {
        type: Number,
        value: 6
      }

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


  async __imgClicked() {
    try {
      await this.clicked();

      const {naturalHeight, naturalWidth} = await naturals(this._imgPlaceholder);

      const raw = getBBox(this);

      // Adjust for the fact that the carousel is offset 4px left and right.
      const bbox = {
        ...raw,
        left:  raw.left  + 4, 
        right: raw.right - 4,
        width: raw.width - 8,
        x:     raw.x     + 4
      };

      const imgAspect = naturalWidth / naturalHeight;


      const getHeightWidth = () => {

        const deviceAspect = bbox.width  / bbox.height;

        // Device is portriat.
        if (deviceAspect < 1) {

          // Img is portrait.
          if (imgAspect < 1) {

            // Assume the image is full width 
            // and shorter than device screen.
            if (deviceAspect < imgAspect) {

              const height = bbox.width / imgAspect;

              return {height, width: bbox.width};
            }

            // Assume the image is full height 
            // and narrower than device screen.
            const width = bbox.height * imgAspect;

            return {height: bbox.height, width};
          }

          
          // Img is landscape.
          // Assume the image is full width 
          // and shorter than device screen.
          const height = bbox.width / imgAspect;

          return {height, width: bbox.width};
        }

        // Device is landscape.

        // Img is portrait.
        // Assume the image is full height 
        // and narrower than device screen.
        if (imgAspect < 1) {

          const width = bbox.height * imgAspect;

          return {height: bbox.height, width};
        }

        // Img is landscape.

        // Assume the image is full width 
        // and shorter than device screen.
        if (deviceAspect < imgAspect) {

          const height = bbox.width / imgAspect;

          return {height, width: bbox.width};
        }

        // Assume the image is full height 
        // and narrower than device screen.
        const width = bbox.height * imgAspect;

        return {height: bbox.height, width};
      };

      const heightWidth = getHeightWidth();

      // Use the image's measurements rather than the container's.
      const top = (bbox.height / 2) - (heightWidth.height / 2);

      const measurements = {
        ...bbox, 
        ...heightWidth,
        bottom: top + heightWidth.height,
        top,
        x:      top
      };

      this.fire('photo-selected', {measurements, item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(CarouselItem.is, CarouselItem);
