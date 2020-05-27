
import {schedule} from '@longlost/utils/utils.js';


export const ImageEditorItemMixin = superClass => {
  return class ImageEditorItemMixin extends superClass {


    static get properties() {
	    return {

	    	current: String,

	    	edited: String,

      	highQuality: String,

      	item: Object,

      	page: String,

      	selected: String,

	      // This name becomes the new filename 
	      // for any exported files.
	      _name: {
	        type: String,
	        computed: '__computeName(item.displayName, _type)'
	      },

	      // Input image source string.
	      _src: {
	        type: String,
	        computed: '__computeSrc(item, _newSrc)'
	      },

	      _newSrc: String,    

	    };
	  }


	  static get observers() {
	  	return [
	  		'__editedChanged(edited)',
	  		'__currentPageSelectedChanged(current, page, selected)'
	  	];
	  }


	  __computeName(displayName, type) {
	  	if (!type) { return ''; }

	    return displayName ? `${displayName}-${type}` : type;
	  }

	  // Use the optimized version if its present, 
	  // else fallback to a larger format.
	  // Favoring the lower memory version since 
	  // webgl-filter uses canvas for its heavy lifting.
	  // Canvas is known to crash Safari when dealing
	  // with large file sizes.
	  __computeSrc(item, newSrc) {

	  	if (newSrc) { return newSrc; }

	    if (!item) { return '#'; }

	    const {optimized, oriented, original, _tempUrl} = item;

	    if (optimized) { return optimized; }

	    if (oriented)  { return oriented; }

	    if (original)  { return original; }

	    return _tempUrl;
	  }


	  async __editedChanged(src) {
	  	if (src) {
	  		this.__reset();

	  		await schedule();
	  	}

	  	this._newSrc = src;
	  }

	  // Make sure non-selected tab elements are not visible
	  // when exiting the image-editor overlay.
	  // Setting css overflow values breaks the preview elements'
	  // css sticky behavior.
	  __currentPageSelectedChanged(current, page, selected) {
	  	
	  	if (current && page !== current) {
	  		this.style['opacity'] = '0';
	  	}

	  	if (page === selected) {
	  		this.style['opacity'] = '1';
	  	}
	  }

  };
};
