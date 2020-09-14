
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
  *  Properites:
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


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {ListOverlayMixin} from './list-overlay-mixin.js';
import {schedule}         from '@longlost/utils/utils.js';
import htmlString         from './afs-camera-roll.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import '../shared/afs-file-icons.js';
// 'afs-roll-items' lazy loaded after open.


class AFSCameraRoll extends ListOverlayMixin(AppElement) {
  static get is() { return 'afs-camera-roll'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _canShowScale: Boolean,

      // This default is overridden by localstorage 
      // after initial interaction from user.
      _scale: {
        type: Number,
        value: 50
      }

    };
  }


  static get observers() {
    return [
      '__scaleControlsChanged(_dataEmpty, _opened, _canShowScale)'
    ];
  }


  __scaleControlsChanged(empty, opened, canShow) {

    if (empty || !opened || !canShow) {
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


  async open() {

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

}

window.customElements.define(AFSCameraRoll.is, AFSCameraRoll);