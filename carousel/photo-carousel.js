

/**
  * `photo-carousel`
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


import {
  AppElement, 
  html
} from '@longlost/app-element/app-element.js';

import {
  hijackEvent,
  schedule, 
  wait
} from '@longlost/utils/utils.js';

import htmlString from './photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/action-buttons.js';
import './paginated-carousel.js';
import '../shared/afs-edit-photo-fab.js';


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


  async __carouselReady() {

    // NOT using `listenOnce` here since there 
    // is no way to remove the attached event listener
    // for the promise of the two that never resolves.
    let imgResolver;
    let vidResolver;

    const imgOnce = new Promise(resolve => {
      imgResolver = resolve;
    });

    const vidOnce = new Promise(resolve => {
      vidResolver = resolve;
    });

    this.addEventListener('lazy-image-loaded-changed',        imgResolver);
    this.addEventListener('lazy-video-poster-loaded-changed', vidResolver);

    // Wait for current image/poster to load.
    await Promise.race([imgOnce, vidOnce]);

    this.removeEventListener('lazy-image-loaded-changed',        imgResolver);
    this.removeEventListener('lazy-video-poster-loaded-changed', vidResolver);

    // Wait for current image/poster to fade-in.
    await wait(350);

    this.$.carousel.style['opacity'] = '1';
    this._carouselDisabled           = false;

    this.$.flipWrapper.style['display'] = 'none';
    this.$.flip.reset();
    this.__hideBackground();
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


  async __showBackground() {
    this.$.background.style['display'] = 'block';

    await schedule();

    this.$.background.style['opacity'] = '1';
  }


  async open(measurements) {

    this._measurements = measurements;

    // Avoid infinite loops by setting this once per open.
    this._start = this.item;

    this.$.flipWrapper.style['display'] = 'flex';

    await this.__showBackground();

    // Fail gracefully incase there is an issue 
    // with the thumbnail placeholder.
    const safeFlip = async () => {
      try {
        await this.$.flip.play();
      }
      catch (_) {
        console.warn('Flip animation failed gracefully.');
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
  // and when the image-editor is opened over this element.
  stop() {
    this.$.carousel.style['opacity'] = '0';

    this._carouselDisabled = true;
    this._opened           = false;       
    this._start            = undefined;

    this.$.fab.reset();
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);
