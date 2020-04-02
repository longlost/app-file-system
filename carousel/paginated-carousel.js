

/**
  * `paginated-carousel`
  * 
  *   Fullscreen image/photo/video viewer carousel.
  *
  *
  *
  *  Properites:
  *
  *
  *    
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './paginated-carousel.html';
import '@longlost/app-carousel/app-carousel.js';
import './carousel-item.js';


class PaginatedCarousel extends AppElement {
  static get is() { return 'paginated-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

    	// The initial photo item to center on.
    	start: Object,

      opened: Boolean,

      _currentItem: Object,

      // _items: Array,


      _items: {
      	type: Array,
      	computed: '__computeItems(start)'
      },


      _unsubscribes: Array

    };
  }


  // DEV ONLY

  __computeItems(start) {
  	if (!start) { return; }

  	return [
  		{...start, displayName: `${start.displayName} 0`}, 
  		{...start, displayName: `${start.displayName} 1`}, 
  		{...start, displayName: `${start.displayName} 2`}
  	];
  }


  __currentItemChanged(event) {
  	const {carouselIndex} = event.detail.value;

  	if (typeof carouselIndex !== 'number') { return; }

  	this.fire('current-item-changed', {value: this._items[carouselIndex]});
  }


 	async __itemClicked(event) {
 		try {
 			await this.clicked();

 			this.fire('photo-selected', {selected: event.model.item});
 		}
 		catch (error) {
 			if (error === 'click debounced') { return; }
 			console.error(error);
 		}
 	}
 

}

window.customElements.define(PaginatedCarousel.is, PaginatedCarousel);
