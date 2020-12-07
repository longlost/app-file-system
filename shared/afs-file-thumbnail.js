
/**
  * `afs-file-thumbnail`
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


import {AppElement, html}  from '@longlost/app-core/app-element.js';
import {PhotoElementMixin} from '../shared/photo-element-mixin.js';
import htmlString          from './afs-file-thumbnail.html';
import '@polymer/iron-icon/iron-icon.js';
import './afs-file-icons.js';


class AFSFileThumbnail extends PhotoElementMixin(AppElement) {
  static get is() { return 'afs-file-thumbnail'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {  

      // Sets the proportion of width to height for <lazy-video>.
      // 'classic', 'fill', 'landscape', 'portrait' or 'square'
      aspectRatio: {
        type: String,
        value: 'landscape'
      },

      // Lazy-video controls.
      controls: Boolean,  

      // Show a small icon in the top left corner 
      // of video thumbnails that are not playing.
      _hideMovieIcon: {
        type: Boolean,
        value: true,
        computed: '__computeHideMovieIcon(item.type, presentation)'
      },

      // Overwrite PhotoElementMixin prop.
      _isThumbnail: {
        type: Boolean,
        value: true
      }

    };
  }

  __computeHideMovieIcon(type, presentation) {
    if (!type || presentation) { return true; }

    return !type.includes('video');
  }


  __computeIcon(type) {
    if (!type) { return false; }

    if (type.includes('image')) {
      return 'afs-file-icons:image';
    }

    if (type.includes('video')) {
      return 'afs-file-icons:movie';
    }

    if (type.includes('audio')) {
      return 'afs-file-icons:audio';
    }

    if (type.includes('pdf')) {
      return 'afs-file-icons:description';
    }

    return 'afs-file-icons:storage';
  }

}

window.customElements.define(AFSFileThumbnail.is, AFSFileThumbnail);
