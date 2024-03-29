

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
  getBBox,
  getRootTarget,
  hijackEvent,
  listenOnce,
  schedule, 
  wait
} from '@longlost/app-core/utils.js';

import template from './afs-photo-carousel.html';

import '@longlost/app-images/flip-image.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../shared/afs-action-buttons.js';
import './afs-db-carousel.js';
import '../shared/afs-edit-photo-fab.js';


class AFSPhotoCarousel extends AppElement {

  static get is() { return 'afs-photo-carousel'; }

  static get template() { return template; }


  static get properties() {
    return {

      // Passed to paginated-carousel.
      coll: String,

      // Used for entry animation and inital setup.
      item: Object,

      // The selected index in relation to '_cachedItems'.
      _cachedIndex: Number,

      // These items are cached for use with 
      // 'stop' and 'resume' public methods.
      //
      // 'afs-db-carousel' fires these as they change
      // to keep the cached values here updated.
      // 
      // In 'resume' they are used to reinitialize 
      // 'db-carousel' where it was previously stopped.
      _cachedItems: Array,

      _carouselDisabled: {
        type: Boolean,
        value: true
      },

      // The centered item from app-carousel.
      _centeredItem: Object,

      _currentItem: {
        type: Object,
        computed: '__computeCurrentItem(_carouselDisabled, _centeredItem.data)'
      },

      // 'db-carousel' starting index.
      _index: Number,

      _measurements: Object,

      _opened: Boolean,

      _placeholder: {
        type: String,
        computed: '__computePlaceholder(item)'
      },

      // Drives template 'dom-if'.
      _stamp: Boolean,

      // Only cache values if the carousel will be resumed later.
      _stopped: Boolean,

      // The selected index in relation to '_tempItems'.
      _tempIndex: Number,

      // 'db-carousel' temporary inital db items.
      _tempItems: Array,

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

    // Start animations, but no need to await them.
    this.select('#fab').exit();
    this.select('#overlay').back();
  }

  // Overlay reset event handler.
  __reset() {

    // Cache current state for resume.
    if (this._stopped && this._centeredItem) {

      const {uid} = this._centeredItem.data;

      this._stopped     = false;
      this._cachedItems = this.select('#carousel').getRepeaterItems();
      this._cachedIndex = this._cachedItems.findIndex(item => 
                            item.data.uid === uid);
    }
    else {

      // Cleanup.
      this._cachedItems = undefined;
      this._cachedIndex = undefined;
    }

    this._carouselDisabled = true;
    this._opened           = false; 

    this.select('#fab').reset();

    // Setup the transition for a fade-in after the `image-editor`
    // closes and the carousel is ready again.
    this.$.overlay.style['opacity']              = '0';
    this.$.overlay.style['transition']           = 'opacity 300ms ease-out';
    this.select('#carousel').style['transition'] = 'opacity 300ms ease-out';
    this.select('#carousel').style['opacity']    = '0';
  
    this._stamp = false;
  }


  async __hideBackground() {

    this.$.background.style['opacity'] = '0';

    // Safari fix. Without waiting before setting display,
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

    // NOT using `listenOnce` here since there is no 
    // way to remove the attached event listeners
    // for the other events than never fire.
    const raceImgEvents = () => new Promise(resolve => {

      let errorOccured;

      const handler = event => {

        const {detail, type} = event;
        
        // Ignore events fired for value changes to false.
        if (detail?.value === false) { return; }

        const target = getRootTarget(event);
        const uid    = target?.parentNode?.host?.item?.uid;

        // Ignore events that come from images other than the
        // currently "centered" element.
        if (uid !== this._centeredItem?.data?.uid) { return; }

        const isImgError = type.includes('image') && type.includes('error');

        // Ignore any first image error to allow the 
        // remaining image type to load successfully.
        if (isImgError && !errorOccured) {

          errorOccured = true;

          return;
        }

        this.removeEventListener('lazy-image-error-changed',             handler);
        this.removeEventListener('lazy-image-placeholder-error-changed', handler);
        this.removeEventListener('lazy-image-faded-in',                  handler);
        this.removeEventListener('lazy-image-placeholder-faded-in',      handler);
        this.removeEventListener('lazy-video-poster-error-changed',      handler);
        this.removeEventListener('lazy-video-poster-loaded-changed',     handler);

        resolve();
      };

      this.addEventListener('lazy-image-error-changed',             handler);
      this.addEventListener('lazy-image-placeholder-error-changed', handler);
      this.addEventListener('lazy-image-faded-in',                  handler);
      this.addEventListener('lazy-image-placeholder-faded-in',      handler);
      this.addEventListener('lazy-video-poster-error-changed',      handler);
      this.addEventListener('lazy-video-poster-loaded-changed',     handler);
    });

    // Wait for current image/poster to fade-in/load.
    await raceImgEvents();

    this._carouselDisabled                    = false;
    this.select('#carousel').style['opacity'] = '1';

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
    this.select('#overlay').close();
  }


  __photoSelected(event) {

    hijackEvent(event);

    this.fire('open-photo-viewer', event.detail);
  }


  __waitForStamper() {

    if (this._stamp) { 

      return Promise.resolve(); 
    }

    this._stamp = true;

    return listenOnce(this.$.stamper, 'dom-change');
  }


  async open({index, measurements, resume, tempIndex, tempItems}) {

    // Order here is important. Set '_tempIndex' and '_tempItems' 
    // before '_index'. This is because 'db-carousel' observes
    // '_index', not the others.
    this._tempIndex    = tempIndex;
    this._tempItems    = tempItems;
    this._index        = index;
    this._measurements = measurements;

    await this.__waitForStamper();

    this.$.flipWrapper.style['transition'] = 'unset';
    this.$.flipWrapper.style['display']    = 'flex';

    // Fade in while resuming.
    if (resume) {

      this.$.flipWrapper.style['opacity'] = '0';
    }
    else {

      // No fade transition from FLIP to carousel "slight of hand".
      this.$.overlay.style['transition']           = 'unset';
      this.select('#carousel').style['transition'] = 'unset'; 
      this.$.flipWrapper.style['opacity']          = '1';
    }

    await this.__showBackground();

    // Fail gracefully in case there is an issue 
    // with the thumbnail placeholder.
    const safeFlip = async () => {

      try {

        // Fade in when resuming.
        this.$.flipWrapper.style['transition'] = 'opacity 200ms ease-in 300ms';
        this.$.flipWrapper.style['opacity']    = '1';

        await this.$.flip.play();
      }
      catch (_) {

        this.$.flipWrapper.style['display'] = 'none';
      }  
    };

    if (resume) {

      await safeFlip();


      this.$.overlay.style['opacity'] = '1';

    }
    else {

      await Promise.all([
        safeFlip(), 
        this.select('#overlay').open()
      ]);
    }

    // Setup for 'stop'/'resume' entry animation.
    // This creates a simple shrink/fade-in transition.
    this._measurements = getBBox(this.select('#carousel'));

    this._opened = true;
  }

  // Open and resume the carousel once the image-editor is closed.
  resume() {

    const {index} = this._centeredItem;

    return this.open({
      index, 
      measurements: this._measurements,
      resume:       true,
      tempIndex:    this._cachedIndex, 
      tempItems:    this._cachedItems
    });
  }

  // Stop carousel db updates when this overlay is closed
  // and when the `image-editor` is opened over this element.
  stop() {

    // Values from 'db-carousel' will be cached for 'resume()'.
    this._stopped = true; 

    this.__reset();
  }

}

window.customElements.define(AFSPhotoCarousel.is, AFSPhotoCarousel);
