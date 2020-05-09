

/**
  * `image-filters`
  * 
  *   
  *   Alter the appearance of an imput image with common adjustments and filters.
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
import {canvasFile} 			from '../shared/utils.js';
import webglFilter 				from '@longlost/webgl-filter/webgl-filter.js';
import htmlString         from './image-filters.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-button/paper-button.js';
import './image-editor-icons.js';
import './filter-item.js';


const createFilter = (filter, source) => name => {
	filter.addFilter(name);

	const canvas = filter.apply(source);

	filter.reset();

	return canvas.toDataURL();
};


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


class ImageFilters extends AppElement {
  static get is() { return 'image-filters'; }

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
      	computed: '__computeApplyBtnDisabled(item, _filter, _selectedFilter)'
      },

      // 'webgl-filter' instance.
      _filter: Object,

      _filters: {
      	type: Array,
      	computed: '__computeFilters(_filter, _loaded, _preview)'
      },

      _highQuality: {
      	type: String,
      	computed: '__computeHighQuality(item)'
      },

      _loaded: Boolean,

      // This name becomes the new filename 
      // for any exported crop files.
      _name: {
        type: String,
        computed: '__computeName(item.displayName)'
      },

      _page: {
      	type: String,
      	value: 'filters',
      	readOnly: true
      },

      _previewSrc: {
      	type: String,
      	computed: '__computePreviewSrc(_filter, _src)'
      },

      _selectedFilter: String,

      // Input image source string.
      _src: {
        type: String,
        computed: '__computeSrc(item)'
      }

    };
  }


  static get observers() {
  	return [
  		'__selectedPageChanged(selected, _page)'
  	];
  }


  connectedCallback() {
  	super.connectedCallback();

  	this._preview = this.$.preview;
  }


  __computeApplyBtnDisabled(item, filter, selectedFilter) {
  	return !Boolean(item && filter && selectedFilter);
  }


  __computeFilters(filter, loaded, preview) {
  	if (!filter || !loaded || !preview) { return; }

  	const creator = createFilter(filter, preview);

  	return [
  		{src: creator('brownie'), 			 			name: 'brownie', 		 	 			 label: 'Brownie'},
  		{src: creator('kodachrome'), 		 			name: 'kodachrome',  	 			 label: 'Kodachrome'},
  		{src: creator('polaroid'), 			 			name: 'polaroid', 	 		 		 label: 'Polaroid'},
  		{src: creator('sepia'), 				 			name: 'sepia', 			 	 			 label: 'Sepia'},
  		{src: creator('technicolor'), 	 			name: 'technicolor', 	 			 label: 'Technicolor'},
  		{src: creator('vintagePinhole'), 			name: 'vintagePinhole', 		 label: 'Vintage'},
  		{src: creator('desaturateLuminance'), name: 'desaturateLuminance', label: 'Desaturate'},
  		{src: creator('desaturate'), 					name: 'desaturate', 	 	 		 label: 'Greyscale'}
  	];
  }


  __computeHighQuality(item) {
    if (!item) { return '#'; }

    const {oriented, original, _tempUrl} = item;

    if (oriented) { return oriented; }

    if (original) { return original; }

    return _tempUrl;
  }


  __computeName(displayName) {
    return displayName ? `${displayName}-filter` : 'filtered';
  }


  __computePreviewSrc(filter, src) {
  	if (filter && src) { return src; }

  	return '#';
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


  __filterSelected(event) {
  	this._selectedFilter = event.detail.value;
  }


  __reset() {
  	if (this._filter) {
  		this._filter.reset();
  		this._filter 				 = undefined;
  		this._loaded 				 = false;
  		this._selectedFilter = undefined;
  	}
  }


  __init() {
  	if (!this._filter) {
  		this._filter = webglFilter();
  	}
  }


  async __applyClicked() {
  	try {
  		await this.clicked();

  		await this.$.spinner.show('Applying filter.');	
  	
  		const file =  await highQualityFile(
  			this._filter, 
  			this._selectedFilter, 
  			this._highQuality, 
  			this._name
  		);

  		this.fire('image-filters-applied', {value: file});
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  		await warn('Could not apply the filter.');
  	}
  	finally {
  		this.$.spinner.hide();
  	}
  }

}

window.customElements.define(ImageFilters.is, ImageFilters);
