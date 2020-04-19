

/**
  * `photo-viewer`
  * 
  *   Image/photo/video fullscreen viewer overlay with pinch to zoom.
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


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {schedule}         from '@longlost/utils/utils.js';
import htmlString         from './photo-viewer.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-images/lazy-image.js';
import '@longlost/app-overlays/app-overlay.js';
import '@longlost/pinch-to-zoom/pinch-to-zoom.js';


class PhotoViewer extends AppElement {
  static get is() { return 'photo-viewer'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Used for entry animation and inital setup.
      item: Object,

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


  __computePlaceholder(item) {
    if (!item) return '#';

    const {_tempUrl, optimized, oriented} = item;

    if (optimized) {
      return optimized;
    }

    if (oriented) {
      return oriented;
    }

    return _tempUrl;
  }


  __computeSrc(item) {
    if (!item) { return '#'; }

    const {_tempUrl, oriented} = item;

    return oriented ? oriented : _tempUrl;
  }


  __reset() {
    this.$.content.style['background-color'] = 'transparent';
    this.$.img.style['opacity'] = '0';

    this.$.zoom.setTransform({
      scale: 1,
      x:     0,
      y:     0
    });
  }


  async __backBtnClicked() {
    try {
      await this.clicked();

      this.$.flip.reset();

      await schedule();

      this.$.overlay.back();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __setImgSize() {


    // Using content bbox instead of window.innerHeight/innerWidth
    // because of mobile Safari's bottom nav bar not being part
    // of those measurements.  Css position: fixed with bottom: 0
    // does take this into account.
    const bbox            = this.$.content.getBoundingClientRect();
    const {height, width} = this._measurements;
    const deviceAspect    = bbox.width / bbox.height;
    const aspect          = width      / height;
    const heightDelta     = Math.round(bbox.height - height);
    const widthDelta      = Math.round(bbox.width  - width);

    // Device is portrait.
    if (deviceAspect <= 1) {      

      // This represents the width required to 
      // get the img height to fill the screen.
      // Use largest aspect ratio of landscape/portrait images.
      const heightAdjustment = (width + heightDelta) * Math.max(aspect, 1 / aspect);

      // Use the heightAdjustment if the image height is
      // the limiting factor, otherwise set the img width
      // to fill the screen.
      const w = Math.max(bbox.width, heightAdjustment);

      this.$.img.style['height'] = `${bbox.height}px`;
      this.$.img.style['width']  = `${w}px`;
    }
    else {
      const widthAdjustment = (height + widthDelta) * Math.max(aspect, 1 / aspect);

      // Use the widthAdjustment if the image height is
      // the limiting factor, otherwise set the img width
      // to fill the screen.
      const h = Math.max(bbox.height, widthAdjustment);
      const w = bbox.width + (heightDelta * aspect);

      this.$.img.style['height'] = `${h}px`;
      this.$.img.style['width']  = `${w}px`;
    }
  }


  __switchToImg() {
    this.$.content.style['background-color'] = 'black';
    this.$.img.style['opacity'] = '1';
    this.$.flip.reset();
  }


  async open(measurements) {

    this._measurements = measurements;

    await this.$.flip.play(); 
    await this.$.overlay.open();

    this.__setImgSize();

    await schedule();

    this.__switchToImg();
  }

}

window.customElements.define(PhotoViewer.is, PhotoViewer);