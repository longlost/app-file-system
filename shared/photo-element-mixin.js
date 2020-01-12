

import {
	hijackEvent,
	listen,
	schedule,
	unlisten
} from '@longlost/utils/utils.js';
import '@longlost/lazy-image/lazy-image.js';
import '@longlost/lazy-video/lazy-video.js';


export const PhotoElementMixin = superClass => {
  return class PhotoElementMixin extends superClass {


    static get properties() {
	    return {

	      // File item.
	      item: Object,

	      // Passed into <lazy-video>.
	      presentation: {
	        type: Boolean,
	        value: false
	      },

	      // Passed into <lazy-image>.
	      sizing: {
	        type: String,
	        value: 'cover' // Or 'contain'.
	      },

	      _imgLoadedListenerKey: Object,

	      _imgPlaceholder: {
	      	type: String,
	      	computed: '__computeImgPlaceholder(item)'
	      },

	      _imgSrc: {
	      	type: String,
	      	computed: '__computeImgSrc(item, _isThumbnail)'
	      },

	      _isImg: {
	        type: Boolean,
	        value: false,
	        computed: '__computeIsImg(item.type)'
	      },

	      _isVid: {
	        type: Boolean,
	        value: false,
	        computed: '__computeIsVid(item.type)'
	      },

	      // Can be overwritten by implementation.
	      _isThumbnail: {
	      	type: Boolean,
	      	value: false
	      },

	      _orientation: {
	      	type: Number,
	      	computed: '__computeOrientation(item.exif)'
	      },

	      _vidPlaceholder: {
	      	type: String,
	      	computed: '__computeVidPlaceholder(item)'
	      },

	      _vidSrc: {
	      	type: String,
	      	computed: '__computeVidSrc(item)'
	      }

	    };
	  }


	  connectedCallback() {
	  	super.connectedCallback();

	  	this._imgLoadedListenerKey = listen(
	  		this,
	  		'loaded-changed',
	  		this.__handleImageLoadedChanged.bind(this)
  		);

  		this._vidLoadedListenerKey = listen(
  			this,
  			'lazy-video-metadata-loaded',
  			this.__handleMetadataLoaded.bind(this)
  		);
	  }


	  disconnectedCallback() {
	  	super.disconnectedCallback();

	  	unlisten(this._imgLoadedListenerKey);
	  }


	  __computeIsImg(type) {
	    return type && type.includes('image');
	  }


	  __computeIsVid(type) { 
	    return type && type.includes('video');
	  }


	  __computeImgPlaceholder(item) {
	    if (!item) { return; }

	    const {original, _tempUrl} = item;

	    if (original) { return; }

	    return _tempUrl;
	  }


	  __computeImgSrc(item, isThumbnail) {
	    if (!item) { return; }

	    const {optimized, original, thumbnail} = item;

	    if (isThumbnail && thumbnail) { return thumbnail; }

	    if (!isThumbnail && optimized) { return optimized; }

	    if (original)  { return original; }

	    return;
	  }


	  __computeOrientation(exif) {
	    return exif ? exif['Orientation'] : undefined;
	  }


	  __computeVidPlaceholder(item) {
	    if (!item) { return; }

	    const {original, _tempUrl} = item;

	    if (original) { return; }

	    return _tempUrl;
	  }


	  __computeVidSrc(item) {
	    if (!item) { return; }

	    const {original} = item;

	    if (original) { return original; }

	    return;
	  }

	  // <lazy-image> 'on-loaded-changed' event handler.
	  async __handleImageLoadedChanged(event) {
	  	hijackEvent(event);

	    if (!this.item) { return; }

	    const {value: loaded}      = event.detail;
	    const {original, _tempUrl} = this.item;

	    if (loaded && _tempUrl && !original) {
	      await schedule(); // <lazy-image> workaround.
	      window.URL.revokeObjectURL(_tempUrl);
	    }
	  }

	  // <lazy-video> 'lazy-video-metadata-loaded' event handler.
	  __handleMetadataLoaded() {
	  	hijackEvent(event);
	  	
	    const {original, _tempUrl} = this.item;

	    if (_tempUrl && !original) {
	      window.URL.revokeObjectURL(_tempUrl);
	    }
	  }

  };
};
