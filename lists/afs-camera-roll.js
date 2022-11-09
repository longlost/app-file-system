
/**
  * `afs-camera-roll`
  * 
  *   Displays photos in a compact list form. 
  *
  *   Shows uploading/optimization and gives the user options for 
  *   deleting, printing, downloading and sharing.
  *
  *
  *
  *  Properties:
  *
  *
  *    Inherited from list-overlay-mixin.js
  *
  *
  *
  *
  *  
  *  Methods:
  *
  *
  *
  *    open() - Opens overlay.
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement}       from '@longlost/app-core/app-element.js';
import {schedule, wait}   from '@longlost/app-core/utils.js';
import {ListOverlayMixin} from './list-overlay-mixin.js';
import template           from './afs-camera-roll.html';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import '../shared/afs-file-icons.js';
import '../shared/afs-progress-bar.js';
// 'afs-roll-items' lazy loaded after open.


class AFSCameraRoll extends ListOverlayMixin(AppElement) {

  static get is() { return 'afs-camera-roll'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      progress: Object,

      // Overwriting mixin prop value.
      title: {
        type: String,
        value: 'My Photos'
      },

      _canShowScale: Boolean,

      // This default is overridden by localstorage 
      // after initial interaction from user.
      _scale: {
        type: Number,
        value: 50
      },

      _showingProgress: Boolean,

    };
  }


  static get observers() {
    return [
      '__progressOpenedChanged(progress, _opened)',
      '__scaleControlsChanged(_dataEmpty, _opened, _canShowScale, _showingProgress)'
    ];
  }

  // Progress takes priority over scale slider ui.
  // When progress is visible, hide the scale.
  async __progressOpenedChanged(progress, opened) {

    if (!progress || !opened) {
      await this.$.progress.hide();

      this._showingProgress = false;

      return;
    }

    // NOT using closure values here so the reads are in real-time.
    if (
      this.progress.read      !== this.progress.reading || 
      this.progress.processed !== this.progress.processing
    ) {

      this._showingProgress = true;

      await wait(350);

      // Read again.
      if (
        this.progress.read      !== this.progress.reading || 
        this.progress.processed !== this.progress.processing
      ) {
        this.$.progress.show();
      }

      return; 
    }
    
    // Give time for `paper-gauge` final count animation to finish.
    await wait(1200); 

    // `afs-file-sources` can work without its light dom stamped.
    // Check read vals again, user may have added more.
    // NOT using closure values here so the reads are in real-time.
    if (
      this.progress.read      === this.progress.reading && 
      this.progress.processed === this.progress.processing
    ) {

      await this.$.progress.hide();

      this._showingProgress = false;
    }
  }


  __scaleControlsChanged(empty, opened, canShow, showingProgress) {

    if (empty || !opened || !canShow || showingProgress) {
      this.__hideScale();
    } 
    else {
      this.__showScale();
    }
  }


  __localstorageDataChanged(event) {

    this._scale = event.detail.value;
  }


  __overlayTriggered(event) {

    const triggered = event.detail.value;

    // Noop on overlay initialization during first open.
    if (!this.$.overlay.header) { return; }

    if (triggered) {
      this._canShowScale = false;
    }
    else {
      this._canShowScale = true;
    }
  }


  __hideScale() {

    this.$.scale.classList.add('hide-scale');
  }


  __showScale() {

    this.$.scale.classList.remove('hide-scale');
  }


  __setupScale() {

    this.$.scale.style['display'] = 'flex';
  }


  __resetScale() {

    this.$.scale.style['display'] = 'none';
  }


  __sliderValChanged(event) {

    this._scale = event.detail.value;
  }

  // Overlay 'on-reset' handler.
  __reset() {

    this._canShowScale = false;
    this._opened       = false;

    this.__resetScale();
  }


  async __open() {

    await schedule();

    await this.$.overlay.open();

    this.__setupScale();
    this._opened = true;

    await import(
      /* webpackChunkName: 'afs-roll-items' */ 
      './afs-roll-items.js'
    );

    await schedule();

    this._canShowScale = true;
  }


  open() {

    this._isSelector = false;

    return this.__open();
  }
  

  openSelector() {
    
    this._isSelector = true;

    return this.__open();
  }

}

window.customElements.define(AFSCameraRoll.is, AFSCameraRoll);
