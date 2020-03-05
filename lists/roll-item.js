
/**
  * `roll-item`
  * 
  *   Photo/video camera-roll list item.
  *
  *
  * @implements ItemMixin
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {
  AppElement, 
  html
}                  from '@longlost/app-element/app-element.js';
import {ItemMixin} from './item-mixin.js';
import htmlString  from './roll-item.html';


class RollItem extends ItemMixin(AppElement) {
  static get is() { return 'roll-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {      

      // Firestore coll path string.
      coll: String,
      
      // File item object.
      item: Object,

      // File upload controls, progress and state.
      uploads: Object,

      _progress: Number,

      _state: String,

      _upload: {
        type: Object,
        computed: '__computeUpload(item.uid, uploads)'
      }

    };
  }


  static get observers() {
    return [
      '__uploadChanged(_upload)'
    ];
  }


  __computeUpload(uid, uploads) {
    if (!uid || !uploads) { return; }

    return uploads[uid];
  }

  // This is a performance enhancement 
  // over using a wildcard observer.
  __uploadChanged(upload) {

    if (!upload) {

      this._progress = 0;
      this._state    = '';
      this.__computeProgress = null;
      this.__computeState    = null;

    }
    else {      

      this.__computeProgress = progress => progress;
      this.__computeState    = state    => state;

      // Polymer specific dynamic computed properties.
      this._createComputedProperty(
        '_progress', 
        `__computeProgress(uploads.${upload.uid}.progress)`, 
        true
      );
      this._createComputedProperty(
        '_state', 
        `__computeState(uploads.${upload.uid}.state)`, 
        true
      );
    }
  }


  async __thumbnailClicked() {
    try {
      await this.clicked();

      this.fire('open-carousel', {item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(RollItem.is, RollItem);
