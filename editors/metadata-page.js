
/**
  * `metadata-page`
  * 
  *   Display and update file metadata in a shared content section.
  *   Can edit file 'displayName', 'keywords', 'notes'.
  *
  *
  *
  *  Properites:
  *
  *  
  *    item - <Object> required: File item data object.
  *
  *
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  FileInfoMixin
}                 from '../shared/file-info-mixin.js';
import {
  compose,
  map,
  split
}                 from '@longlost/lambda/lambda.js';
import {
  isOnScreen
}                 from '@longlost/utils/utils.js';
import htmlString from './metadata-page.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/app-inputs/app-textarea.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '../shared/file-icons.js';


const normalize       = x => x.trim().toLowerCase();
const toKeywordsArray = compose(split(' '), map(normalize));


class MetadataPage extends FileInfoMixin(AppElement) {
  static get is() { return 'metadata-page'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Passed into <app-map>.
      darkMode: Boolean,

      geolocation: {
        type: Object,
        value: null // Firestore does not allow undefined values.
      },

      isImg: Boolean,

      list: String,

      // State of interaction with inputs.
      _changes: {
        type: Boolean,
        value: false
      },

      _displayName: String,

      _geoLocationBtnIcon: {
        type: String,
        value: 'file-icons:add-location',
        computed: '__computedGeolocationBtnIcon(item.geolocation)'
      },

      _geoLocationBtnText: {
        type: String,
        value: 'ADD LOCATION',
        computed: '__computedGeolocationBtnText(item.geolocation)'
      },

      _hideGeolocationEditBtn: {
        type: Boolean,
        value: true,
        computed: '__computeHideGeolocationEditBtn(item.exif)'
      },

      _hideGPSDisplay: {
        type: Boolean,
        value: true,
        computed: '__computeHideGPSDisplay(_gps)'
      },

      _notes: String,

      _rawKeywords: String

    };
  }


  static get observers() {
    return [
      '__geolocationChanged(geolocation)',
      '__gpsChanged(_gps)',
      '__itemChanged(item)',
      '__displayNameChanged(_displayName)'
    ];
  }


  __computedGeolocationBtnIcon(geolocation) {
    return geolocation ? 'file-icons:edit-location' : 'file-icons:add-location'
  }


  __computedGeolocationBtnText(geolocation) {
    return geolocation ? 'EDIT LOCATION' : 'ADD LOCATION';
  }


  __computeHideGeolocationEditBtn(exif) {
    return exif && exif['GPSLatitude'];
  }


  __computeHideGPSDisplay(gps) {
    return !Boolean(gps);
  }


  __computeHideOrder(list) {
    return list !== 'files';
  }


  __computeSaveBtnClass(isImg) {
    return isImg ? 'is-img' : '';
  }


  __geolocationChanged(geolocation) {
    if (geolocation) {
      this._changes = true;
    }
  }


  async __gpsChanged(gps) {
    if (gps) {

      await isOnScreen(this.$.map);

      await import(
        /* webpackChunkName: 'app-map' */ 
        '@longlost/app-map/app-map.js'
      );

      this.$.map.resize();
    }
  }


  __itemChanged(item) {
    if (!item) { return; }

    const {displayName, keywords, notes} = item;

    this._displayName = displayName;
    this._rawKeywords = keywords ? keywords.join(' ') : '';

    // No undefined values for Firestore.
    this._notes   = notes ? notes : null;
    this._changes = false;
  }


  __displayNameChanged(name) {

    // For consumption by parent element.
    this.fire('display-name-changed', {value: name});
  }


  __displayNameInputValueChanged(event) {
    this._displayName = event.detail.value.trim();
    this._changes     = true;
  }


  __keywordsInputValueChanged(event) {
    this._rawKeywords = event.detail.value.trim();
    this._changes     = true;
  }


  __notesChanged(event) {
    this._notes   = event.detail.value;
    this._changes = true;
  }


  async __editGeolocationBtnClicked() {
    try {
      await this.clicked();

      this.fire('open-map-overlay');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __saveBtnClicked() {
    try {
      await this.clicked();

      const keywords = toKeywordsArray(this._rawKeywords);

      const item = {
        ...this.item, 
        displayName: this._displayName,
        geolocation: this.geolocation,
        keywords, 
        notes:       this._notes
      };

      this.fire('update-item', {item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(MetadataPage.is, MetadataPage);
