

/**
  * `photo-carousel`
  * 
  *   Image/photo/video viewer ovelay with a carousel ui.
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
  *    open()
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  schedule, 
  wait
}                 from '@longlost/utils/utils.js';
import htmlString from './photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-images/lazy-image.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/action-buttons.js';
import './paginated-carousel.js';


class PhotoCarousel extends AppElement {
  static get is() { return 'photo-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Passed to paginated-carousel.
      coll: String,

      // Used for entry animation and inital setup.
      item: Object,

      _carouselDisabled: {
        type: Boolean,
        value: true
      },

      _currentItem: Object,

      _imgLoaded: Boolean,

      _items: Array,

      _opened: Boolean,

      _orientation: {
        type: Number,
        computed: '__computeOrientation(item.exif)'
      },

      _placeholder: {
        type: String,
        computed: '__computePlaceholder(item)'
      },

      _src: {
        type: String,
        computed: '__computeSrc(item)'
      },

      // paginated-carousel starting item.
      _start: Object,

      _title: {
        type: String,
        value: ' ',
        computed: '__computeTitle(_currentItem.displayName)'
      }

    };
  }


  static get observers() {
    return [
      '__loadedOpenedChanged(_imgLoaded, _opened)'
    ];
  }


  __computeOrientation(exif) {
    if (!exif || !exif['Orientation']) { return 1; }

    return exif['Orientation'];
  }


  __computePlaceholder(item) {
    if (!item) return '#';

    const {_tempUrl, thumbnail} = item;

    return thumbnail ? thumbnail : _tempUrl;
  }


  __computeSrc(item) {
    if (!item) { return; }

    const {optimized, original} = item;

    return optimized ? optimized : original;
  }


  __computeTitle(displayName) {
    return displayName ? displayName : ' ';
  }


  async __loadedOpenedChanged(loaded, opened) {

    if (loaded && opened) {
      
      // Wait til <lazy-image> fades in.
      await wait(550);
      this.$.flip.reset();
    }
  }


  __reset() {
    this._carouselDisabled = true;
    this._opened           = false;
    this._lazySrc          = undefined;

    this.$.lazyImg.style['display']  = 'none';
    this.$.lazyImg.style['opacity']  = '0';
    this.$.carousel.style['opacity'] = '0';
  }


  __lazyImgLoaded(event) {
    this._imgLoaded = event.detail.value;
  }


  async __editBtnClicked() {
    try {
      await this.clicked();

      this.fire('edit-image', {item: this._currentItem});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __carouselReady() {
    this.$.carousel.style['opacity'] = '1';

    await schedule();

    this._carouselDisabled = false;
    this.$.lazyImg.style['display']  = 'none';
    this.$.lazyImg.style['opacity']  = '0';
  }


  __currentItemChanged(event) {

    if (this._carouselDisabled) { return; }

    this._currentItem = event.detail.value;
  }


  __photoSelected(event) {
    this.fire('open-photo-viewer', event.detail);
  }


  async open(measurements) {

    this._measurements = measurements;

    // Avoid infinite loops by setting this once per open.
    this._start = this.item; 

    await this.$.flip.play();

    this.$.lazyImg.style['display'] = 'block';  

    await schedule();

    this.$.lazyImg.style['opacity'] = '1';

    await import('@longlost/app-overlays/app-header-overlay.js');

    await this.$.overlay.open();

    this._opened = true;
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);
