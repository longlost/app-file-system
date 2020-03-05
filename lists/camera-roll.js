
/**
  * `camera-roll`
  * 
  *   Displays photos in a compact list form. 
  *
  *   Shows uploading/optimization and gives the user options for 
  *   deleting, printing, downloading and sharing.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *    items - <Array> required: Input items from Firestore db.
  *
  *
  *
  *
  *  
  *  Methods:
  *
  *
  *
  *    delete() - Clears multiselect after a delete operation.
  *              
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  hijackEvent,
  listen,
  unlisten,
  wait
}                 from '@longlost/utils/utils.js';
import services   from '@longlost/services/services.js';
import htmlString from './camera-roll.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import './multiselect-btns.js';


// import './roll-items.js';


class CameraRoll extends AppElement {
  static get is() { return 'camera-roll'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Firestore coll path string.
      coll: String,

      data: Object,

      // File upload controls, progress and state.
      uploads: Object,

      // All item checkboxes selected when true.
      _all: {
        type: Boolean,
        value: false
      },

      // Set to true to hide <select-checkbox>'s
      _hideCheckboxes: {
        type: Boolean,
        value: true
      }, 

      // This default is overridden by localstorage 
      // after initial interaction from user.
      _scale: {
        type: Number,
        value: 50
      }

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this._itemsSelectedListenerKey = listen(
      this,
      'item-selected',
      this.__itemSelected.bind(this)
    );
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    unlisten(this._itemsSelectedListenerKey);
  }


  __localstorageDataChanged(event) {
    this._scale = event.detail.value;
  }


  __overlayTriggered(event) {
    const triggered = event.detail.value;

    // Noop on overlay initialization during first open.
    if (!this.$.overlay.header) { return; }

    if (triggered) {
      this.__hideScale();
    }
    else {
      this.__showScale();
    }
  }


  __hideScale() {
    this.$.scale.classList.add('hide-scale');
  }


  __showScale() {
    this.$.scale.classList.remove('hide-scale');
  }


  __resetScale() {
    this.$.scale.style['display'] = 'none';
  }


  __allChanged(event) {
    this._all = event.detail.value;
  }


  __hideCheckboxesChanged(event) {
    this._hideCheckboxes = event.detail.value;
  }


  __itemSelected(event) {
    hijackEvent(event);

    const {item, selected} = event.detail;

    if (selected) {
      this.$.multi.selected(item);
    }
    else {
      this.$.multi.unselected(item);
    }
  }


  __sliderValChanged(event) {
    this._scale = event.detail.value;
  }


  cancelUploads(uids) {
    this.$.items.cancelUploads(uids);
  }


  delete() {
    this.$.multi.delete();
  }


  async open() {
    this.$.scale.style['display'] = 'flex';

    await this.$.overlay.open();

    await import(
      /* webpackChunkName: 'app-file-system-roll-items' */ 
      './roll-items.js'
    );
    
    this.__showScale();
  }

}

window.customElements.define(CameraRoll.is, CameraRoll);
