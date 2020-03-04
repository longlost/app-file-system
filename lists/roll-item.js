
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

      files: Object,
      
      // File item object.
      item: Object,

      _file: {
        type: Object,
        computed: '__computeFile(item.uid, files)'
      }

    };
  }


  static get observers() {
    return [
      '__fileChanged(_file)'
    ];
  }


  __computeFile(uid, files) {
    if (!uid || !files) { return; }

    return files[uid];
  }

  // This is a performance enhancement 
  // over using a wildcard observer.
  __fileChanged(file) {

    if (!file) {

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
        `__computeProgress(files.${file.uid}.progress)`, 
        true
      );
      this._createComputedProperty(
        '_state', 
        `__computeState(files.${file.uid}.state)`, 
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
