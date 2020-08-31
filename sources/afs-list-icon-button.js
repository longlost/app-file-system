
/**
  * `afs-list-icon-button`
  * 
  *   Icon button with a badge that animates when files are being uploaded and processed in the cloud.
  *
  *
  *  properites:
  *
  *  
  *    coll - Firebase collection string.
  *
  *
  *    count - Number of file or photo documents currently in the collection.
  *
  *
  *    list - 'Files' or 'Photos', determines which icon to display in the button.
  * 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {
  AppElement, 
  html
} from '@longlost/app-element/app-element.js';

import {
  schedule,
  wait
} from '@longlost/utils/utils.js';

import htmlString from './afs-list-icon-button.html';
import services   from '@longlost/services/services.js';
import '@longlost/app-icons/app-icons.js';
import '@longlost/badged-icon-button/badged-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/afs-file-icons.js';


class AFSListIconButton extends AppElement {
  static get is() { return 'afs-list-icon-button'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Firestore collection.
      coll: String,  

      // Total number of file items saved in db.
      count: Number,

      // Determines which icon is shown for the <paper-icon-button>
      list: String,

      // Uploading arrow animation state.
      _animateArrow: {
        type: Boolean,
        value: false
      },

      // Cloud processing gear animation state.
      _animateGear: {
        type: Boolean,
        value: false,
        computed: '__computeAnimateGear(_optimizing, _thumbail)'
      },

      _icon: {
        type: String,
        computed: '__computeIcon(list)'
      },

      _optimizing: Boolean,

      _optimizingUnsubscribe: Object,

      _show: {
        type: Boolean,
        computed: '__computeShow(count)'
      },

      _thumbail: Boolean,

      _thumnailUnsubscribe: Object,

      _uploadingUnsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__animateGearChanged(_animateGear)',
      '__collShowChanged(coll, _show)'
    ];
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.__unsub();
  }


  __computeAnimateGear(optimizing, thumbnail) {
    return optimizing || thumbnail;
  }


  __computeIcon(list) {
    switch (list) {
      case 'files':
        return 'afs-file-icons:dashboard-90';
      case 'photos':
        return 'afs-file-icons:apps';
      default:
        return 'afs-file-icons:dashboard-90';
    }
  }


  __computeShow(count) {
    return typeof count === 'number' && count > 0;
  }


  __startUploadingSub(coll) {

    const callback = results => {

      if (results.length > 0) {
        this.__startArrowAnimation();
      }
      else {
        this.__stopArrowAnimation();
      }
    };

    const errorCallback = () => {
      this.__stopArrowAnimation();
    };

    return services.querySubscribe({
      callback,
      coll,
      errorCallback,
      limit: 1,      
      query: {
        comparator: null, 
        field:     'original', 
        operator:  '=='
      }
    });
  }


  __startOptimizedSub(coll) {

    const callback = results => {

      if (results.length > 0) {
        this._optimizing = true;
      }
      else {
        this._optimizing = false;
      }
    };

    const errorCallback = () => {
      this._optimizing = false;
    };

    return services.querySubscribe({
      callback,
      coll,
      errorCallback,
      limit: 1,
      query: [{
        comparator: true, 
        field:     'isProcessable', 
        operator:  '=='
      }, {
        comparator: '\uf8ff', 
        field:     'original', 
        operator:  '<'
      }, {
        comparator: null, 
        field:     'optimized', 
        operator:  '=='
      }, {
        comparator: null, 
        field:     'optimizedError', 
        operator:  '=='
      }]
    });
  }

  __startThumbnailSub(coll) {

    const callback = results => {

      if (results.length > 0) {
        this._thumbail = true;
      }
      else {
        this._thumbail = false;
      }
    };

    const errorCallback = () => {
      this._thumbail = false;
    };

    return services.querySubscribe({
      callback,
      coll,
      errorCallback,
      limit: 1,
      query: [{
        comparator: true, 
        field:     'isProcessable', 
        operator:  '=='
      }, {
        comparator: '\uf8ff', 
        field:     'original', 
        operator:  '<'
      }, {
        comparator: null, 
        field:     'thumbnail', 
        operator:  '=='
      }, {
        comparator: null, 
        field:     'thumbnailError', 
        operator:  '=='
      }]
    });
  }


  async __collShowChanged(coll, show) {

    if (!coll || !show) {
      this.__unsub();
      return;
    }

    this._uploadingUnsubscribe  = await this.__startUploadingSub(coll);
    this._optimizingUnsubscribe = await this.__startOptimizedSub(coll);
    this._thumnailUnsubscribe   = await this.__startThumbnailSub(coll);   
  }


  __startArrowAnimation() {
    this.$.arrow.classList.add('start-arrow');
    this.$.count.classList.add('start-count');
  }


  __stopArrowAnimation() {
    this.$.arrow.classList.remove('start-arrow');
    this.$.count.classList.remove('start-count');
  }


  async __startGearAnimation() {
    this.$.gear.classList.add('show-gear');
    await wait(450);
    this.$.gear.classList.add('start-gear');
  }


  async __stopGearAnimation() {
    this.$.gear.classList.remove('start-gear');
    await schedule();
    this.$.gear.classList.remove('show-gear');
  }


  __animateGearChanged(animate) {
    if (animate) {
      this.__startGearAnimation();
    }
    else {
      this.__stopGearAnimation();
    }
  }


  __unsub() {
    if (this._uploadingUnsubscribe) {
      this._uploadingUnsubscribe();
      this._uploadingUnsubscribe = undefined;
    }

    if (this._optimizingUnsubscribe) {
      this._optimizingUnsubscribe();
      this._optimizingUnsubscribe = undefined;
    }

    if (this._thumbnailUnsubscribe) {
      this._thumbnailUnsubscribe();
      this._thumbnailUnsubscribe = undefined;
    }
  }

}

window.customElements.define(AFSListIconButton.is, AFSListIconButton);
