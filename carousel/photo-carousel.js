

/**
  * `photo-carousel`
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
import '../shared/action-buttons.js';


class PhotoCarousel extends AppElement {
  static get is() { return 'photo-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Used for entry animation and inital setup.
      item: Object,

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


  async __loadedOpenedChanged(loaded, opened) {

    if (loaded && opened) {
      
      // Wait til <lazy-image> fades in.
      await wait(550);
      this.$.flip.reset();
    }
  }


  async __reset() {
    this.$.lazyImg.style['opacity'] = '0';

    await wait(250);

    this._opened  = false;
    this._lazySrc = undefined;

    this.$.lazyImg.style['display'] = 'none';
  }


  __lazyImgLoaded(event) {
    this._imgLoaded = event.detail.value;
  }


  async open(measurements) {

    this._measurements = measurements;

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
