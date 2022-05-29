

import {hijackEvent, schedule} from '@longlost/app-core/utils.js';
import '@longlost/app-images/lazy-image.js';
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

	      _imgPlaceholder: {
	      	type: String,
	      	computed: '__computeImgPlaceholder(item.thumbnail, item._tempUrl, _isImg, _isThumbnail)'
	      },

	      _imgSrc: {
	      	type: String,
	      	computed: '__computeImgSrc(item.original, item.optimized, item.thumbnail, _isImg, _isThumbnail)'
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

	      _vidPlaceholder: {
	      	type: String,
	      	computed: '__computeVidPlaceholder(item.original, item._tempUrl, _isVid)'
	      },

	      _vidPoster: {
	      	type: String,
	      	computed: '__computeVidPoster(item.poster, item.optimized, item.thumbnail, _isVid, _isThumbnail)'
	      },

	      _vidSrc: {
	      	type: String,
	      	computed: '__computeVidSrc(item.original, _isVid)'
	      }

	    };
	  }


	  connectedCallback() {

	  	super.connectedCallback();

	  	this.__handleImageLoadedChanged = this.__handleImageLoadedChanged.bind(this);
	  	this.__handleMetadataLoaded 		= this.__handleMetadataLoaded.bind(this);

	  	this.addEventListener('lazy-image-loaded-changed', this.__handleImageLoadedChanged);
  		this.addEventListener('lazy-video-metadata-loaded-changed', this.__handleMetadataLoaded);
	  }


	  disconnectedCallback() {

	  	super.disconnectedCallback();

	  	this.removeEventListener('lazy-image-loaded-changed', this.__handleImageLoadedChanged);
  		this.removeEventListener('lazy-video-metadata-loaded-changed', this.__handleMetadataLoaded);
	  }


	  __computeIsImg(type) {

	    return type && type.includes('image');
	  }


	  __computeIsVid(type) { 

	    return type && type.includes('video');
	  }


	  __computeImgPlaceholder(thumbnail, temp, isImg, isThumbnail) {

	    if (!isImg) { return; }	 

	    // Allow the thumbnail url to be set as the 
	    // main src so the image fades in.
	    if (thumbnail) { 

	    	if (isThumbnail) { return; }

	    	return thumbnail; 
	    }

	    return temp;
	  }


	  __computeImgSrc(original, optimized, thumbnail, isImg, isThumbnail) {

	    if (!isImg) { return; }

	    if (isThumbnail && thumbnail) { return thumbnail; }

	    if (!isThumbnail && optimized) { return optimized; }

	    return original;
	  }


	  __computeVidPlaceholder(original, temp, isVid) {

	    if (!isVid) { return; }

	    return original ? original : temp;
	  }


	  __computeVidPoster(poster, optimized, thumbnail, isVid, isThumbnail) {

	    if (!isVid) { return; }

	    if (isThumbnail && thumbnail) { return thumbnail; }

	    if (!isThumbnail && optimized) { return optimized; }

	    return poster;
	  }


	  __computeVidSrc(original, isVid) {

	    if (!isVid) { return; }

	    return original;
	  }

	  // <lazy-image> 'lazy-image-loaded-changed' event handler.
	  async __handleImageLoadedChanged(event) {

	  	hijackEvent(event);

	    if (!this.item) { return; }

	    const {value: loaded} = event.detail;
	    const {_tempUrl} 			= this.item;

	    if (loaded && _tempUrl) {
	      await schedule(); // <lazy-image> workaround.
	      
	      try {
	        window.URL.revokeObjectURL(_tempUrl);
	      }
	      catch (_) { /* noop */ }
	    }
	  }

	  // <lazy-video> 'lazy-video-metadata-loaded' event handler.
	  __handleMetadataLoaded(event) {
	  	
	  	hijackEvent(event);
	  	
	    const {_tempUrl} = this.item;

	    if (_tempUrl) {
	      try {
	        window.URL.revokeObjectURL(_tempUrl);
	      }
	      catch (_) { /* noop */ }
	    }
	  }

  };
};
