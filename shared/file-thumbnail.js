
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


import {AppElement, html}  from '@longlost/app-element/app-element.js';
import {PhotoElementMixin} from '../shared/photo-element-mixin.js';
import htmlString          from './file-thumbnail.html';
import '@polymer/iron-icon/iron-icon.js';
import './file-icons.js';


class FileThumbnail extends PhotoElementMixin(AppElement) {
  static get is() { return 'file-thumbnail'; }

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

      // Overwrite PhotoElementMixin prop.
      _isThumbnail: {
        type: Boolean,
        value: true
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

}

window.customElements.define(FileThumbnail.is, FileThumbnail);
