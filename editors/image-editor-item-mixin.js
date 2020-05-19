

export const ImageEditorItemMixin = superClass => {
  return class ImageEditorItemMixin extends superClass {


    static get properties() {
	    return {

	    	editedSrc: String,

      	item: Object,

      	page: String,

      	selected: String,

      	_highQuality: {
	        type: String,
	        computed: '__computeHighQuality(item)'
	      },

	      // This name becomes the new filename 
	      // for any exported files.
	      _name: {
	        type: String,
	        computed: '__computeName(item.displayName, _type)'
	      },

	      // Input image source string.
	      _src: {
	        type: String,
	        computed: '__computeSrc(item, editedSrc)'
	      }	      

	    };
	  }


	  static get observers() {
	  	return [
	  		'__selectedPageChanged(selected, page)',
	  		'__editedSrcChanged(editedSrc)'
	  	];
	  }


	  __computeHighQuality(item) {
	    if (!item) { return '#'; }

	    const {oriented, original, _tempUrl} = item;

	    if (oriented) { return oriented; }

	    if (original) { return original; }

	    return _tempUrl;
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
	  __computeSrc(item, editedSrc) {

	  	if (editedSrc) { return editedSrc; }

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

	    // image-cropper.js does not have an init method.
	    else if (this.__init) {
	      this.__init();
	    }
	  }


	  __editedSrcChanged(src) {
	  	if (src) {
	  		this.__reset();
	  	}
	  }

  };
};
