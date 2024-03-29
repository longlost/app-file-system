
/**
  * `afs-carousel-item`
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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  getBBox,
  hijackEvent,
  naturals, 
  schedule
} from '@longlost/app-core/utils.js';

import {PhotoElementMixin} from '../shared/photo-element-mixin.js';

import template from './afs-carousel-item.html';


// Fault tolerance for failed thumbnail cloud processes.
// Try the placeholder first, but if its not valid
// attempt the src.
const getNaturals = async (placeholder, src) => {

  try {
    const dimensions = await naturals(placeholder);

    return dimensions;
  }
  catch (_) {
    return naturals(src);
  }
};


class AFSCarouselItem extends PhotoElementMixin(AppElement) {

  static get is() { return 'afs-carousel-item'; }

  static get template() { return template; }


  static get properties() {
    return {

      index: Number,

      _naturals: Object

    };
  }


  static get observers() {
    return [
      '__placeholderSrcChanged(_imgPlaceholder, _imgSrc)'
    ];
  }

  // Cache the image measurements to improve click handler speed.
  async __placeholderSrcChanged(placeholder, src) {

    try {

      this._naturals = undefined; // Clear cached val.

      if (placeholder || src) {      
        this._naturals = await getNaturals(placeholder, src);
      }
    }
    catch (_) { return; } // Silence image loading errors. No op.
  }


  async __imgClicked() {
    
    try {
      await this.clicked();

      // Use cached values when available,
      // but wait for img load for early clicks.
      const {naturalHeight, naturalWidth} = this._naturals ? 
        this._naturals :
        await getNaturals(this._imgPlaceholder, this._imgSrc);

      // Improves reliability.
      await schedule();

      const bbox      = getBBox(this);
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
      // Add bbox.top and bbox.left to get the correct starting reference
      // for scrolled content or responsively sized content that is not
      // fullbleed.
      const top  = ((bbox.height / 2) - (heightWidth.height / 2)) + bbox.top;
      const left = ((bbox.width  / 2) - (heightWidth.width  / 2)) + bbox.left;

      const measurements = {
        ...bbox, 
        ...heightWidth,
        top,
        right:  left + heightWidth.width,
        bottom: top  + heightWidth.height,
        left
      };

      this.fire('photo-selected', {measurements, item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // Squelsh errors from the unused element.
  __lazyImageErrorChangedHandler(event) {

    if (this._isVid) {

      hijackEvent(event);
    }
  }

  // Squelsh errors from the unused element.
  __lazyImagePlaceholderErrorChangedHandler(event) {

    if (this._isVid) {

      hijackEvent(event);
    }
  }

  // Squelsh errors from the unused element.
  __lazyVideoErrorChangedHandler(event) {

    if (this._isImg) {

      hijackEvent(event);
    }
  }

  // Squelsh errors from the unused element.
  __lazyVideoPlaceholderErrorChangedHandler(event) {

    if (this._isImg) {

      hijackEvent(event);
    }
  }

}

window.customElements.define(AFSCarouselItem.is, AFSCarouselItem);
