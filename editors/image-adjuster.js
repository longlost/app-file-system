

/**
  * `image-adjuster`
  * 
  *   
  *   Alter the appearance of an imput image with simple adjustments.
  *
  *
  *
  *  Properites:
  *
  *
  *     item - Required. Image file db object.    
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
import {scale} 						from '@longlost/lambda/lambda.js';
import {canvasFile} 			from '../shared/utils.js';
import webglFilter 				from '@longlost/webgl-filter/webgl-filter.js';
import htmlString         from './image-adjuster.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-button/paper-button.js';
import './image-editor-icons.js';



// TODO:
//  		Apply all filters.

const highQualityFile = async (filter, name, src, displayName) => {

	const img = new Image();

	const promise = new Promise((resolve, reject) => {
		img.onload = async () => {

			filter.reset();
			filter.addFilter(name);

			const canvas = filter.apply(img);
			const file 	 = await canvasFile(src, displayName, canvas); 

			resolve(file);
		};

		img.onerror = reject;
	});	


	// MUST set crossorigin to allow WebGL to securely load the downloaded image.
	img.crossOrigin = '';
	img.src = src;

	return promise;
};


class ImageAdjuster extends AppElement {
  static get is() { return 'image-adjuster'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      selected: String,

      _applyBtnDisabled: {
      	type: Boolean,
      	value: true,
      	computed: '__computeApplyBtnDisabled(item, _filter)'
      },

      _blur: Number,

      _brightness: Number,

      _centeredVal: {
      	type: Number,
      	value: 50
      },

      _contrast: Number,

      // 'webgl-filter' instance.
      _filter: Object,

      _highQuality: {
      	type: String,
      	computed: '__computeHighQuality(item)'
      },

      _hue: Number,

      _loaded: Boolean,

      // This name becomes the new filename 
      // for any exported crop files.
      _name: {
        type: String,
        computed: '__computeName(item.displayName)'
      },

      _page: {
      	type: String,
      	value: 'adjuster',
      	readOnly: true
      },

      _previewSrc: String,

      _saturation: Number,

      // Scaler function for brightnes, contrast and saturation.
      _scaler: Object,

      _sharpness: Number,

      // Javascript Image object.
      _source: Object,

      // Input image source string.
      _src: {
        type: String,
        computed: '__computeSrc(item)'
      },

      _zeroedVal: {
      	type: Number,
      	value: 0
      }

    };
  }


  static get observers() {
  	return [
  		'__adjustmentsChanged(_filter, _source, _brightness, _contrast, _saturation, _hue, _sharpness, _blur)',
  		'__filterSrcChanged(_filter, _src)',
  		'__selectedPageChanged(selected, _page)'
  	];
  }


  connectedCallback() {
  	super.connectedCallback();

  	this._preview = this.$.preview;

  	// Scale args -> inputMin, inputMax, outputMin, outputMax, input.
  	this._scaler = scale(0, 100, -1, 1);
  }


  __computeApplyBtnDisabled(item, filter) {
  	return !Boolean(item && filter);
  }


  __computeHighQuality(item) {
    if (!item) { return '#'; }

    const {oriented, original, _tempUrl} = item;

    if (oriented) { return oriented; }

    if (original) { return original; }

    return _tempUrl;
  }


  __computeName(displayName) {
    return displayName ? `${displayName}-adjust` : 'adjusted';
  }

  // Use the optimized version if its present, 
  // else fallback to a larger format.
  // Favoring the lower memory version since 
  // webgl-filter uses canvas for its heavy lifting.
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


  __adjustmentsChanged(filter, source, brightness, contrast, saturation, hue, sharpness, blur) {
  	if (!filter || !source) { return; }

  	filter.reset();

  	filter.addFilter('brightness', brightness);
  	filter.addFilter('contrast', 	 contrast);
  	filter.addFilter('saturation', saturation);
  	filter.addFilter('hue', 			 hue);
  	filter.addFilter('sharpen', 	 sharpness);
  	filter.addFilter('blur', 			 blur);

		const canvas = filter.apply(source);

		this._previewSrc = canvas.toDataURL();
  }


  __filterSrcChanged(filter, src) {

  	const img = new Image();
	
		img.onload = () => {
			this._source = img;
		};

		img.onerror = () => {
			this._source = undefined;
		};

		// MUST set crossorigin to allow WebGL to securely load the downloaded image.
		img.crossOrigin = '';
		img.src 				= src;
  }


  __selectedPageChanged(selected, page) {
  	if (selected !== page) {
  		this.__reset();
  	}
  	else {
  		this.__init();
  	}
  }


  __loaded() {
  	if (this._src && this._src !== '#') {
  		this._loaded = true;
  	}
  }


  __reset() {
  	if (this._filter) {
  		this._filter.reset();

  		this._centeredVal = 50;  		
  		this._filter 			= undefined;
  		this._loaded 			= false;
  		this._zeroedVal 	= 0;
  	}
  }


  __init() {
  	if (!this._filter) {
  		this._filter = webglFilter();
  	}
  }


  __brightnessChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value} 	 = event.detail;
  		this._brightness = this._scaler(value);
  	});
  }


  __contrastChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value}  = event.detail;
  		this._contrast = this._scaler(value);
  	});
  }


  __saturationChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value} 	 = event.detail;
  		this._saturation = this._scaler(value);
  	});
  }


  __hueChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value} = event.detail;
  		this._hue 		= value;
  	});
  }


  __sharpenChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value} 	= event.detail;
  		this._sharpness = value / 100;
  	});
  }


  __blurChanged(event) {
  	window.requestAnimationFrame(() => {
  		const {value} = event.detail;
  		this._blur 		= value / 5;
  	});
  }


  async __applyClicked() {
  	try {
  		await this.clicked();

  		await this.$.spinner.show('Applying adjustments.');	


  		// TODO:
  		// 			Update this to work for entire filter chain.

  	
  		// const file =  await highQualityFile(
  		// 	this._filter, 
  		// 	this._highQuality, 
  		// 	this._name
  		// );

  		// this.fire('image-adjustments-applied', {value: file});
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  		await warn('Could not apply the adjustments.');
  	}
  	finally {
  		this.$.spinner.hide();
  	}
  }

}

window.customElements.define(ImageAdjuster.is, ImageAdjuster);
