

/**
  * `image-cropper`
  * 
  *   
  *   Crop, rotate and zoom an imput image.
  *
  *
  *
  *  Properites:
  *
  *
  *			item - Required. Image file db object.    
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
  *    
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString 				from './image-cropper.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './crop-wrapper.js';
import './image-editor-icons.js';

// String --> Number/undefined
// A helper function that converts
// an aspect dom element name
// to the appropriate number form
// for crop-wrapper.
const getRatio = name => {
	switch (name) {
  	case 'free':
  		return undefined;
  	case '16:9':
  		return 16 / 9;
		case '4:3':
			return 4 / 3;
		case 'square':
			return 1;
		case '2:3':
			return 2 / 3;
		default:
			return undefined;
  }
};



class ImageCropper extends AppElement {
  static get is() { return 'image-cropper'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      // This name becomes the new filename 
      // for any exported crop files.
      _name: {
      	type: String,
      	computed: '__computeName(item.displayName)'
      },

      _selectedAspect: {
      	type: String,
      	value: 'free'
      },

      _selectedFlips: {
      	type: Array,
      	value: () => ([])
      },

      _selectedShape: {
      	type: String,
      	value: 'square'
      },

      // Input image source string.
      _src: {
      	type: String,
      	computed: '__computeSrc(item)'
      }

    };
  }


  connectedCallback() {
  	super.connectedCallback();

  	this.$.a11y.target = document.body;
  }


  __computeName(displayName) {
  	return displayName ? `${displayName}-crop` : 'cropped';
  }

  // Use the optimized version if its present, 
  // else fallback to a larger format.
  // Favoring the lower memory version since 
  // Cropperjs uses canvas for its heavy lifting.
  // Canvas is known to crash Safari when dealing
  // with large file sizes.
  __computeSrc(item) {
  	if (!item) { return '#'; }

  	const {optimized, oriented, original, _tempUrl} = item;

  	if (optimized) { return optimized; }

  	if (oriented)  { return oriented; }

  	if (original)  { return original; }

  	return _tempUrl;
  }


  __a11yKeysPressed(event) {

  	const {key} = event.detail.keyboardEvent;

  	switch (key) {
  		case 'ArrowDown':
  			this.$.down.click();
  			break;
  		case 'ArrowLeft':
  			this.$.left.click();
  			break;
			case 'ArrowRight':
				this.$.right.click();
				break;
			case 'ArrowUp':
				this.$.up.click();
				break;
			default:
				break;
  	}
  }


  async __btnClicked(callback, ...args) {
  	try {

  		if (!this.$.cropper.isReady) { return; }

  		await this.clicked(100);

  		callback.bind(this.$.cropper)(...args);
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  	}
  }


  __zoomInClicked() {
  	this.__btnClicked(this.$.cropper.zoom, 0.1);
  }


  __zoomOutClicked() {
  	this.__btnClicked(this.$.cropper.zoom, -0.1);
  }


  __flipHorzClicked() {
  	this.__btnClicked(this.$.cropper.flipHorz);
  }


  __flipVertClicked() {
  	this.__btnClicked(this.$.cropper.flipVert);
  }


  __squareClicked() {
  	this._selectedShape = 'square';
  	this.__btnClicked(this.$.cropper.setRound, false);
  }


  __circleClicked() {  	
  	this._selectedShape = 'circle';
  	this.__btnClicked(this.$.cropper.setRound, true);
  }


  __aspectRatioSelected(event) {
  	if (!this.$.cropper.isReady) { return; }

  	const {value: name} = event.detail;

  	this._selectedAspect = name;
  	this.$.cropper.setAspectRatio(getRatio(name));
  }


  __resetClicked() {
  	this._selectedAspect = 'free';
  	this._selectedFlips  = [];
  	this._selectedShape  = 'square';
  	this.__btnClicked(this.$.cropper.reset);
  }


  __upClicked() {
  	this.__btnClicked(this.$.cropper.move, 0, -10);
  }


  __leftClicked() {
  	this.__btnClicked(this.$.cropper.move, -10, 0);
  }


  __rightClicked() {
  	this.__btnClicked(this.$.cropper.move, 10, 0);
  }


  __downClicked() {
  	this.__btnClicked(this.$.cropper.move, 0, 10);
  }

}

window.customElements.define(ImageCropper.is, ImageCropper);
