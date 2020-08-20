

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
  listenOnce,
  schedule, 
  wait
} from '@longlost/utils/utils.js';

import htmlString from './photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-overlays/app-header-overlay.js';
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

      // The centered item from app-carousel.
      _centeredItem: Object,

      _currentItem: {
        type: Object,
        computed: '__computeCurrentItem(_carouselDisabled, _centeredItem)'
      },

      _editBtnDisabled: {
        type: Boolean,
        value: true,
        computed: '__computeEditBtnDisabled(_currentItem)'
      },

      _hideEditBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideEditBtn(_currentItem)'
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


  __computeEditBtnDisabled(currentItem) {
    return !Boolean(currentItem);
  }


  __computeHideEditBtn(item) {
    if (!item || !item.type) { return true; }

    const {optimized, poster, thumbnail, type} = item;

    if (type.includes('image')) {
      return false;
    }

    if (type.includes('video')) {

      // Can't edit of all poster generating cloud processes failed.
      if (!optimized && !poster && !thumbnail) {
        return true;
      }

      return false;
    }

    return true;
  }


  __computePlaceholder(item) {
    if (!item) return '#';

    const {_tempUrl, thumbnail} = item;

    return thumbnail ? thumbnail : _tempUrl;
  }


  __computeTitle(displayName) {
    return displayName ? displayName : ' ';
  }

  // Overlay reset event handler.
  __reset() { 
    this.stop();
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


  async __hideBackground() {
    this.$.background.style['opacity'] = '0';

    // Safari fix. Without waiting before seting display,
    // the next iteration will not respect the transition.
    await schedule();

    this.$.background.style['display'] = 'none';
  }


  async __carouselReady() {

    // Wait for current image/poster to load.
    await Promise.race([
      listenOnce(this, 'lazy-image-loaded-changed'),
      listenOnce(this, 'lazy-video-poster-loaded-changed')
    ]);

    // Wait for current image/poster to fade-in.
    await wait(350);

    this.$.carousel.style['opacity'] = '1';
    this._carouselDisabled           = false;

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
  }

}

window.customElements.define(PhotoCarousel.is, PhotoCarousel);
