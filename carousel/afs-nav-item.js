
/**
  * `afs-nav-item`
  * 
  *   Displays a small thumbnail for the photo carousel quick nav element.
  *
  *
  *
  *  Properites:
  *
  *  
  *   item - File data object.
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement}        from '@longlost/app-core/app-element.js';
import {hijackEvent}       from '@longlost/app-core/utils.js';
import {PhotoElementMixin} from '../shared/photo-element-mixin.js';
import template            from './afs-nav-item.html';
import '@polymer/iron-image/iron-image.js';


class AFSNavItem extends PhotoElementMixin(AppElement) {

  static get is() { return 'afs-nav-item'; }

  static get template() { return template; }


  static get properties() {
    return {

      index: Number,

      // PhotoElementMixin setup.
      _isThumbnail: {
        type: Boolean,
        value: true
      },

      _src: {
        type: String,
        computed: '__computeSrc(_imgSrc, _vidPoster)'
      }

    };
  }


  __computeSrc(src, poster) {

    if (src) { return src; }

    if (poster) { return poster; }

    return '#';
  }


  async __imgClicked() {
    
    try {

      await this.clicked();

      this.fire('item-selected', {uid: this.item.uid});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

  // Squelsh error events.
  __errorChangedHandler(event) {

    hijackEvent(event);
  }

  // Squelsh load events.
  __srcChangedHandler(event) {

    hijackEvent(event);
  }

}

window.customElements.define(AFSNavItem.is, AFSNavItem);
