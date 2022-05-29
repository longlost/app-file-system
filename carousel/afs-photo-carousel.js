

/**
  * `afs-photo-carousel`
  * 
  *   Image/photo/video viewer overlay with a carousel ui.
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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  hijackEvent,
  schedule, 
  wait
} from '@longlost/app-core/utils.js';

import template from './afs-photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/afs-action-buttons.js';
import './afs-paginated-carousel.js';
import '../shared/afs-edit-photo-fab.js';


class AFSPhotoCarousel extends AppElement {

  static get is() { return 'afs-photo-carousel'; }

  static get template() {
    return template;
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

      // The centered item from app-carousel.
      _centeredItem: Object,

      _currentItem: {
        type: Object,
        computed: '__computeCurrentItem(_carouselDisabled, _centeredItem)'
      },

      _opened: Boolean,

      _placeholder: {
        type: String,
        computed: '__computePlaceholder(item)'
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


  __computeCurrentItem(disabled, centered) {

    if (disabled || !centered) { return; }

    return centered;
  }


  __computePlaceholder(item) {

    if (!item) return '#';

    const {_tempUrl, thumbnail} = item;

    return thumbnail ? thumbnail : _tempUrl;
  }


  __computeTitle(displayName) {

    return displayName ? displayName : ' ';
  }


  async __back() {   

    this.__hideBackground();

    await schedule();

    this.$.fab.exit();

    await wait(100);

    this.$.overlay.back();
  }

  // Overlay reset event handler.
  __reset() { 

    this.stop();
  }


  async __hideBackground() {

    this.$.background.style['opacity'] = '0';

    // Safari fix. Without waiting before seting display,
    // the next iteration will not respect the transition.
    await schedule();

    this.$.background.style['display'] = 'none';
  }


  async __showBackground() {

    this.$.background.style['display'] = 'block';

    await schedule();

    this.$.background.style['opacity'] = '1';
  }


  async __carouselReady() {

    // NOT using `listenOnce` here since there 
    // is no way to remove the attached event listener
    // for the promise of the two that never resolves.
    let resolver;

    const once = new Promise(resolve => {
      resolver = resolve;
    });

    this.addEventListener('lazy-image-placeholder-loaded-changed', resolver);
    this.addEventListener('lazy-image-loaded-changed',             resolver);
    this.addEventListener('lazy-video-poster-loaded-changed',      resolver);

    // Wait for current image/poster to load.
    await once;

    this.removeEventListener('lazy-image-placeholder-loaded-changed', resolver);
    this.removeEventListener('lazy-image-loaded-changed',             resolver);
    this.removeEventListener('lazy-video-poster-loaded-changed',      resolver);

    // Wait for current image/poster to fade-in.
    await wait(350);

    this.$.carousel.style['opacity'] = '1';
    this._carouselDisabled           = false;

    this.$.flipWrapper.style['display'] = 'none';
    this.$.flip.reset();
  }


  __centeredItemChanged(event) {

    hijackEvent(event);

    this._centeredItem = event.detail.value;
  }


  __lastItemDeleted(event) {

    hijackEvent(event);

    // Overlay 'reset' method causes rendering issues.
    this.$.overlay.close();
  }


  __photoSelected(event) {

    hijackEvent(event);

    this.fire('open-photo-viewer', event.detail);
  }


  async open(measurements) {

    this._measurements = measurements;

    // Avoid infinite loops by setting this once per open.
    this._start = this.item;

    // No fade transition from FLIP to carousel "slight of hand".
    this.$.carousel.style['transition'] = 'unset'; 
    this.$.flipWrapper.style['display'] = 'flex';

    await this.__showBackground();

    // Fail gracefully incase there is an issue 
    // with the thumbnail placeholder.
    const safeFlip = async () => {
      try {
        await this.$.flip.play();
      }
      catch (_) {
        this.$.flipWrapper.style['display'] = 'none';
      }  
    };

    await Promise.all([
      safeFlip(), 
      this.$.overlay.open()
    ]);

    this._opened = true;
  }

  // Resume carousel updates once the image-editor is closed.
  resume() {
    
    this._start  = this.item;
    this._opened = true;
  }

  // Stop carousel db updates when this overlay is closed
  // and when the `image-editor` is opened over this element.
  stop() {

    // Setup the transition for a fade-in after the `image-editor`
    // closes and the carousel is ready again.
    this.$.carousel.style['transition'] = 'opacity 0.3s ease-out';
    this.$.carousel.style['opacity']    = '0';

    this._carouselDisabled = true;
    this._opened           = false;       
    this._start            = undefined;

    this.$.fab.reset();
  }

}

window.customElements.define(AFSPhotoCarousel.is, AFSPhotoCarousel);
