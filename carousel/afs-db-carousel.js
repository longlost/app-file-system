

/**
  * `afs-db-carousel`
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


import {AppElement}     from '@longlost/app-core/app-element.js';
import {hijackEvent}    from '@longlost/app-core/utils.js';
import {orderBy, where} from '@longlost/app-core/services/services.js';
import {DbListMixin}    from '@longlost/app-lists/db-list-mixin.js';
import template         from './afs-db-carousel.html';
import '@longlost/app-carousels/lite-carousel.js';
import './afs-carousel-item.js';


class AFSDbCarousel extends DbListMixin(AppElement) {
  
  static get is() { return 'afs-db-carousel'; }

  static get template() { return template; }


  static get properties() {
    return {

      // Passed to 'lite-carousel'.
      disabled: Boolean,

      // The starting carousel item index.
      index: Number,

      // The selected index in relation to 'tempItems'.
      tempIndex: Number,

      // Temporary inital db items, 
      // used to hydrate the carousel,
      // and kickoff DBListMixin.
      // 
      // These are 'camera-roll' '_reapeaterItems'.
      tempItems: Array,

      // From parent.
      visible: Boolean,

      // Used to wait until the carousel settles on an item before
      // lazy loading new items into the '_beforeItems' array.
      _centered: Boolean,

      // '_listItems' and '__computeData' from DbListMixin.
      _data: {
        type: Object,
        computed: '__computeData(_listItems.*)' 
      },

      // Show carousel nav buttons on large screens 
      // that may not have touch interface.
      _nav: Boolean,

      // Used to fire 'carousel-ready' events once 
      // the carousel is ready to be shown.
      _ready: Boolean

    };
  }


  static get observers() {
    return [
      '__dataChanged(_data)',
      '__disabledItemsChanged(disabled, _listItems.length)',
      '__readyChanged(_ready)',
      '__visibleChanged(visible)',
      '__updateCarouselPlacement(index, visible, _ready)'
    ];
  }


  constructor() {

    super();

    // DbListMixin.
    this.constraints = [
      where('category', 'in', ['image', 'video']),
      orderBy('timestamp', 'desc')
    ];

    this.reverseConstraints = [
      where('category', 'in', ['image', 'video']),
      orderBy('timestamp', 'asc')
    ];

    this.__domChangeHandler = this.__domChangeHandler.bind(this);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.__reset();
  }


  __dataChanged(data) {

    if (!data) { return; }

    this.fire('item-data-changed', {value: data});
  }

  // Check for last item deleted.
  __disabledItemsChanged(disabled, length) {

    if (disabled || typeof length !== 'number') { return; }

    if (length === 0) {
      this.fire('last-item-deleted');
    }
  }


  // All initial data, dom nodes and shifting done.
  // Ready to render the carousel.
  __readyChanged(ready) {

    if (ready) {
      this.fire('carousel-ready');
    }
  }


  async __domChangeHandler(event) {

    try {

      hijackEvent(event);

      await this.debounce('db-carousel-dom-change-debouncer', 100);

      this.__removeDomChangeListener();

      this._ready = true;
    }
    catch (error) {
      if (error === 'debounced') { return; }
      console.error(error);
    }
  }


  __addDomChangeListener() {

    this.$.repeater.addEventListener('dom-change', this.__domChangeHandler);
  }


  __removeDomChangeListener() {

    this.$.repeater.removeEventListener('dom-change', this.__domChangeHandler);
  }


  __startNavMediaQuery() {

    // Larger than iPad Pro.
    this._navMediaQuery = window.matchMedia(`
      (min-width: 1025px) and (orientation: portrait),
      (min-width: 1367px) and (orientation: landscape)
    `);

    // Take immediate readings.   
    this._nav = this._navMediaQuery.matches;

    // Start listening for device changes while app is open.
    this._navMediaQueryCallback = event => {

      if (event.matches) {
        this._nav = true;
      }
      else {
        this._nav = false;
      }
    };

    this._navMediaQuery.addListener(this._navMediaQueryCallback);
  }


  __stopNavMediaQuery() {

    if (this._navMediaQuery) {
      this._navMediaQuery.removeListener(this._navMediaQueryCallback);

      this._navMediaQuery         = undefined;
      this._navMediaQueryCallback = undefined;
    }
  }


  __init() {

    this.__addDomChangeListener();
    this.__startNavMediaQuery();
  }


  __visibleChanged(visible) {

    if (visible) {
      this.__init();
    }
    else {
      this.__reset();
    }
  }


  __updateCarouselPlacement(index, visible, ready) {

    if (
      typeof index !== 'number'          ||
      !ready                             ||
      !visible                           || 
      typeof this.tempIndex !== 'number' ||
      !Array.isArray(this.tempItems)
    ) { return; }

    this.moveTo(index, this.tempIndex, this.tempItems);
  }


  __reset() {

    this.__removeDomChangeListener();
    this.__stopNavMediaQuery();
  }


  __carouselCenteredChanged(event) {

    const {carouselIndex} = event.detail.value;

    if (typeof carouselIndex !== 'number') { return; }

    const item = this._listItems?.[carouselIndex];

    if (!item) { return; }

    const value = {index: carouselIndex, ...item};

    this.fire('centered-item-changed', {value});
  }


  getRepeaterItems() {

    return this._repeaterItems;
  }

}

window.customElements.define(AFSDbCarousel.is, AFSDbCarousel);
