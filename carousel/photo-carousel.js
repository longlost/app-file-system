

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
}                 from '@longlost/app-element/app-element.js';
import {
  schedule, 
  wait
}                 from '@longlost/utils/utils.js';
import htmlString from './photo-carousel.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-overlays/app-header-overlay.js';
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
        computed: '__computeHideEditBtn(_currentItem.type)'
      },

      _items: Array,

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


  __computeHideEditBtn(type) {
    return !type || !type.includes('image');
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


  async __carouselReady() {
    this.$.carousel.style['opacity']   = '1';
    this.$.background.style['opacity'] = '0';

    // Wait for carousel lazy-image fade-in.
    await wait(550);

    this._carouselDisabled = false;
    this.$.background.style['display'] = 'none';
    this.$.flip.reset();
  }


  __centeredItemChanged(event) {
    this._centeredItem = event.detail.value;
  }


  __photoSelected(event) {
    this.fire('open-photo-viewer', event.detail);
  }


  async open(measurements) {

    this._measurements = measurements;

    // Avoid infinite loops by setting this once per open.
    this._start = this.item; 

    this.$.background.style['display'] = 'block';

    await schedule();

    this.$.background.style['opacity'] = '1';

    await Promise.all([
      this.$.flip.play(), 
      this.$.overlay.open()
    ]);

    this._opened = true;
  }

  // Resume carousel updates once the image-editor is closed.
  resume() {
    this._start  = this.item;
    this._opened = true;

    console.log('_start: ', this._start.displayName);
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
