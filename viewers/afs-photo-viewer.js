

/**
  * `afs-photo-viewer`
  * 
  *   Fullscreen photo viewer overlay with pinch to zoom.
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


import {AppElement, html}   from '@longlost/app-element/app-element.js';
import {naturals, schedule} from '@longlost/utils/utils.js';
import htmlString           from './afs-photo-viewer.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-images/lazy-image.js';
import '@longlost/app-overlays/app-overlay.js';
import '@longlost/pinch-to-zoom/pinch-to-zoom.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/afs-file-icons.js';


class AFSPhotoViewer extends AppElement {
  static get is() { return 'afs-photo-viewer'; }

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

    const {_tempUrl, optimized, original, poster} = item;

    if (optimized) {
      return optimized;
    }

    if (poster) {
      return poster;
    }

    if (original) {
      return original;
    }

    return _tempUrl;
  }


  __computeSrc(item) {
    if (!item) { return '#'; }

    const {_tempUrl, original, poster} = item;

    if (poster) {
      return poster;
    }

    return original ? original : _tempUrl;
  }


  async __resetHintIcon() {    
    this.$.hintIcon.style['display'] = 'none';

    await schedule();

    this.$.hintIcon.classList.remove('hint');
  }


  __reset() {
    this.$.background.style['opacity']       = '0';
    this.$.content.style['background-color'] = 'transparent';
    this.$.img.style['opacity']              = '0';

    this.$.zoom.setTransform({
      scale: 1,
      x:     0,
      y:     0
    });

    this.__resetHintIcon();
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


  async __showBackground() {
    this.$.background.style['display'] = 'block';

    await schedule();

    this.$.background.style['opacity'] = '1';
  }


  __setImgSize() {

    const screen = {
      height: window.innerHeight, 
      width:  window.innerWidth
    };

    const {height, width} = this._measurements;
    const deviceAspect    = screen.width / screen.height;
    const aspect          = width / height;
    const heightDelta     = Math.round(screen.height - height);
    const widthDelta      = Math.round(screen.width  - width);

    // Device is portrait.
    if (deviceAspect <= 1) {      

      // This represents the width required to 
      // get the img height to fill the screen.
      // Use largest aspect ratio of landscape/portrait images.
      const heightAdjustment = (width + heightDelta) * Math.max(aspect, 1 / aspect);
      const widthAdjustment  = (width + widthDelta)  * Math.max(aspect, 1 / aspect);

      // Use the heightAdjustment if the image height is the limiting factor, 
      // use widthAdjustment if the image width is the limiting factor, 
      // otherwise set the img width to fill the screen.
      const w = Math.max(screen.width, heightAdjustment, widthAdjustment);

      this.$.img.style['height'] = `${screen.height}px`;
      this.$.img.style['width']  = `${w}px`;
    }
    else {

      const heightAdjustment = (height + heightDelta) * Math.max(aspect, 1 / aspect);
      const widthAdjustment  = (height + widthDelta)  * Math.max(aspect, 1 / aspect);

      // Use the widthAdjustment if the image height is
      // the limiting factor, otherwise set the img width
      // to fill the screen.
      const h = Math.max(screen.height, heightAdjustment, widthAdjustment);
      const w = Math.max(screen.width, heightAdjustment);

      this.$.img.style['height'] = `${h}px`;
      this.$.img.style['width']  = `${w}px`;
    }
  }


  async __switchToImg() {
    this.$.img.style['opacity'] = '1';

    await schedule(); // Improves reliability for iOS Safari.

    this.$.background.style['display']       = 'none';
    this.$.content.style['background-color'] = 'black';
    this.$.flip.reset();
  }


  async open(measurements) {

    this.$.hintIcon.style['display'] = 'inline-block';

    // Run a FLIP animation that leads into the overlay entry.
    if (measurements) {

      this._measurements = measurements;

      await this.$.flip.play();

      // Fade a faux background in for a smooth
      // entry effect for cropped images with a 
      // transparent background.
      await this.__showBackground();
      
      await this.$.overlay.open();

      this.__setImgSize();

      await schedule();

      await this.__switchToImg();      
    }

    // No FLIP, just size the image and open the overlay.
    else {

      const {naturalHeight, naturalWidth} = await naturals(this._placeholder);

      this._measurements = {height: naturalHeight, width: naturalWidth};

      this.__setImgSize();

      await this.__switchToImg();

      await schedule();

      await this.$.overlay.open();      
    }

    await schedule();
    
    // Run hint animation.
    this.$.hintIcon.classList.add('hint');
  }

}

window.customElements.define(AFSPhotoViewer.is, AFSPhotoViewer);
