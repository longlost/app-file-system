
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
import {naturals}          from '@longlost/utils/utils.js';
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

      const screenWidth  = window.innerWidth;
      const screenHeight = window.innerHeight; 

      const {naturalHeight, naturalWidth} = await naturals(this._imgPlaceholder);

      const getHeightWidth = () => {

        const deviceAspect = screenWidth  / screenHeight;
        const imgAspect    = naturalWidth / naturalHeight;

        // Device is portriat.
        if (deviceAspect < 1) {

          // Img is portrait.
          if (imgAspect < 1) {

            // Assume the image is full width 
            // and shorter than device screen.
            if (deviceAspect < imgAspect) {

              const height = screenWidth / imgAspect;

              return {height, width: screenWidth};
            }

            // Assume the image is full height 
            // and narrower than device screen.
            const width = screenHeight * imgAspect;

            return {height: screenHeight, width};
          }

          
          // Img is landscape.
          // Assume the image is full width 
          // and shorter than device screen.
          const height = screenWidth / imgAspect;

          return {height, width: screenWidth};

        }

        // Device is landscape.

        // Img is portrait.
        // Assume the image is full height 
        // and narrower than device screen.
        if (imgAspect < 1) {

          const width = screenHeight * imgAspect;

          return {height: screenHeight, width};
        }

        // Img is landscape.

        // Assume the image is full width 
        // and shorter than device screen.
        if (deviceAspect < imgAspect) {

          const height = screenWidth / imgAspect;

          return {height, width: screenWidth};
        }

        // Assume the image is full height 
        // and narrower than device screen.
        const width = screenHeight / imgAspect;

        return {height: screenHeight, width};
      };

      const heightWidth = getHeightWidth();      
      const bbox = this.getBoundingClientRect();
      const measurements = {...bbox, ...heightWidth};

      this.fire('photo-selected', {measurements, item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  // async __vidClicked() {
  //   try {
  //     await this.clicked();     


  //     // First and last elements are text nodes.
  //     const bbox = this.getBoundingClientRect();


  //     const getMeasurements = bbox => {

  //       if (item.category === 'image') {
  //         const {naturalHeight, naturalWidth} = await naturals(this._imgPlaceholder);
  //       }
        
  //     };


  //     console.log('child: ', children[1]);

  //     this.fire('photo-selected', {measurements, item});
  //   }
  //   catch (error) {
  //     if (error === 'click debounced') { return; }
  //     console.error(error);
  //   }
  // } 

}

window.customElements.define(CarouselItem.is, CarouselItem);
