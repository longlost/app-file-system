
/**
  * `file-thumbnail`
  * 
  *   File item thumbnail.
  *
  *
  *
  *  Properites:
  *
  *  
  *   item - File data object.
  *
  *   sizing - Passed into <lazy-image> sizing prop.
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
import htmlString         from './file-thumbnail.html';
import '@longlost/lazy-image/lazy-image.js';
import '@longlost/lazy-video/lazy-video.js';
import '@polymer/iron-icon/iron-icon.js';
import './file-icons.js';


class FileThumbnail extends AppElement {
  static get is() { return 'file-thumbnail'; }

  static get template() {
    return html([htmlString]);
  }


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
      }

    };
  }


  __computeIronIconStamp(type) {
    if (!type) { return false; }
    return !type.includes('image') && !type.includes('video');
  }


  __computeIcon(type) {
    if (!type) { return false; }

    if (type.includes('audio')) {
      return 'file-icons:audio';
    }

    if (type.includes('pdf')) {
      return 'file-icons:description';
    }

    return 'file-icons:storage';
  }


  __computeLazyImageStamp(type) {
    if (!type) { return false; }
    return type.includes('image');
  }


  __computeLazyVideoStamp(type) {    
    if (!type) { return false; }
    return type.includes('video');
  }


  __computeImgPlaceholder(item) {
    if (!item) { return; }

    const {original, _tempUrl} = item;

    if (original) { return; }

    return _tempUrl;
  }


  __computeImgSrc(item) {
    if (!item) { return; }

    const {original, thumbnail} = item;

    if (thumbnail) { return thumbnail; }

    if (original)  { return original; }

    return;
  }


  __computeVideoPlaceholder(item) {
    if (!item) { return; }

    const {original, _tempUrl} = item;

    if (original) { return; }

    return _tempUrl;
  }


  __computeVideoSrc(item) {
    if (!item) { return; }

    const {original} = item;

    if (original) { return original; }

    return;
  }

  // <lazy-image> 'on-loaded-changed' event handler.
  async __handleImageLoadedChanged(event) {
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
    const {original, _tempUrl} = this.item;
    if (_tempUrl && !original) {
      window.URL.revokeObjectURL(_tempUrl);
    }
  }

}

window.customElements.define(FileThumbnail.is, FileThumbnail);
