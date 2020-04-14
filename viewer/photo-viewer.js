

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
import {schedule} 				from '@longlost/utils/utils.js';
import htmlString 				from './photo-viewer.html';
import '@longlost/app-images/flip-image.js';
import '@longlost/app-images/lazy-image.js';
import '@longlost/app-overlays/app-overlay.js';


class PhotoViewer extends AppElement {
  static get is() { return 'photo-viewer'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Used for entry animation and inital setup.
      item: Object,

      _loaded: Boolean,

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
  		'__loadedOpenedChanged(_loaded, _opened)'
  	];
  }


  __computeOrientation(exif) {
    if (!exif || !exif['Orientation']) { return 1; }

    return exif['Orientation'];
  }


  __computePlaceholder(item) {
    if (!item) return '#';

    const {_tempUrl, optimized, original} = item;

    if (optimized) {
    	return optimized;
    }

    if (original) {
    	return original;
    }

    return _tempUrl;
  }


  __computeSrc(item) {
  	if (!item) { return '#'; }

  	const {_tempUrl, original} = item;

  	return original ? original : _tempUrl;
  }


  __loadedOpenedChanged(loaded, opened) {

  	if (loaded && opened) {
  		this.$.img.style['opacity'] = '1';
  		this.$.flip.reset();
  	}
  }


  __reset() {
  	this._opened = false;

  	this.$.img.style['opacity'] = '0';
  }


  async __loadedChanged(event) {
  	const loaded = event.detail.value;

  	if (loaded) {
  		await schedule();
  	}

  	this._loaded = loaded;
  }


  async __backBtnClicked() {
  	try {
  		await this.clicked();

  		this.$.overlay.back();
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  	}
  }


  async open(measurements) {

    this._measurements = measurements;

    await this.$.flip.play(); 
    await this.$.overlay.open();

    this._opened = true;
  }

}

window.customElements.define(PhotoViewer.is, PhotoViewer);
