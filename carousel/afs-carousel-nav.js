

/**
  * `afs-carousel-nav`
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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  consumeEvent, 
  hijackEvent, 
  schedule
} from '@longlost/app-core/utils.js';

import template from './afs-carousel-nav.html';

import '@longlost/app-carousels/lite-carousel.js';
import './afs-nav-item.js';


class AFSCarouselNav extends AppElement {
  
  static get is() { return 'afs-carousel-nav'; }

  static get template() { return template; }


  static get properties() {
    return {

      carouselReady: Boolean,

      // Passed to 'lite-carousel'.
      disabled: Boolean,

      // The starting carousel item index.
      index: Number,

      // Passed to 'lite-carousel'.
      listItems: Array,

      visible: Boolean,

      _active: {
        type: Boolean,
        computed: '__computeActive(_focused, _recentlyScrolled)'
      },

      _focused: Boolean,

      // Passed to repeater.
      _repeaterItems: Array,

      _recentlyScrolled: Boolean

    };
  }


  static get observers() {
    return [
      '__updateCarouselPlacement(index, carouselReady, visible)'
    ];
  }


  connectedCallback() {

    super.connectedCallback();

    this.__scrollChangedHandler = this.__scrollChangedHandler.bind(this);

    this.addEventListener('lite-list-scroll-changed', this.__scrollChangedHandler);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.removeEventListener('lite-list-scroll-changed', this.__scrollChangedHandler);
  }


  __computeActive(focused, recentlyScrolled) {

    return focused || recentlyScrolled;
  }


  async __updateCarouselPlacement(index, ready, visible) {

    if (
      typeof index !== 'number' ||
      !ready                    ||
      !visible
    ) { 
      return; 
    }

    await schedule();

    this.select('lite-carousel').moveToSection(index);
  }


  __blurFocusHandler(event) {

    consumeEvent(event);

    const {type} = event;

    if (type === 'focus') {

      this._focused = true;
    }
    else {

      this._focused = false;
    }
  }


  __scrollChangedHandler(event) {

    consumeEvent(event);

    this._recentlyScrolled = true;
  }


  async __carouselCenteredChangedHandler(event) {

    try {

      hijackEvent(event);

      if (
        !this._active       ||
        !this.carouselReady || 
        this.disabled       || 
        !this.visible
      ) { 
        return; 
      }

      await this.debounce('afs-carousel-nav-centered-debouncer', 100);

      this._recentlyScrolled = false;

      this.fire('carousel-nav-centered-changed', event.detail);
    }
    catch (error) {
      if (error === 'debounced') { return; }
      console.error(error);
    }
  }

  // Output from 'lite-list/carousel', used to sync
  // the local repeater of slotted items.
  __currentItemsChangedHandler(event) {

    hijackEvent(event);

    this._repeaterItems = event.detail.value;
  }

  // Intercept and quelsh the event.
  // No action taken for clicking these items.
  __itemSelectedHandler(event) {

    hijackEvent(event);

    // Animate to the selected item.
    const {uid} = event.detail;
    const index = this.listItems.findIndex(item => 
                    item.data.uid === uid);

    this.select('lite-carousel').animateToSection(index);
  }

}

window.customElements.define(AFSCarouselNav.is, AFSCarouselNav);
