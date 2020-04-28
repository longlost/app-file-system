
import {PhotoElementMixin} from '../shared/photo-element-mixin.js';
import '@longlost/app-overlays/app-header-overlay.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './metadata-page.js';


export const EditorMixin = superClass => {
  return class EditorMixin extends PhotoElementMixin(superClass) {


    static get properties() {
	    return {

	      // Passed into <map-overlay> and <metadata-page>
	      // which implements <app-map>.
	      darkMode: Boolean,

	      // Pass through to <metadata-page>.
	      list: String,

	      _defaultZoom: {
	        type: Number,
	        value: 0
	      },

	      _editedDisplayName: String,

	      // From <map-overlay> to <metadata-page>.
	      _geolocation: {
	        type: Object,
	        value: null
	      },

	      // <map-overlay> state for setting _defaultZoom.
	      _mapOpened: Boolean,

	      _title: {
	        type: String,
	        computed: '__computeTitle(item.displayName, _editedDisplayName)'
	      }

	    };
	  }


	  static get observers() {
	    return [
	      '__itemGeolocationChanged(item.geolocation, _mapOpened)'
	    ];
	  }


	  __computeTitle(displayName, editedDisplayName) {
	    return editedDisplayName ? editedDisplayName : displayName;
	  }


	  // Only set the default once per session.
	  __itemGeolocationChanged(geolocation, mapOpened) {

	    // Only set this when the overlay has been opened at least once.
	    if (geolocation && mapOpened && this._defaultZoom === 0) {
	      this._defaultZoom = 12;
	    }
	  }


	  __displayNameChanged(event) {
	    this._editedDisplayName = event.detail.value;
	  }


	  async __openMapOverlay() {

	    this._mapOpened = true;

	    await import(
	      /* webpackChunkName: 'map-overlay' */ 
	      '@longlost/app-map/map-overlay.js'
	    );

	    this.$.mapOverlay.open();
	  }


	  __mapOverlaySelectedChanged(event) {
	    this._geolocation = event.detail.selected;
	  }

  };
};
