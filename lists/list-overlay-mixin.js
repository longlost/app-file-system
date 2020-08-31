
/**
  * `ListOverlayMixin`
  * 
  *   Common logic that is shared by file-list and camera-roll.
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: Firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *  
  *
  *
  *
  *
  *  Methods: 
  *
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


import {hijackEvent, listenOnce} from '@longlost/utils/utils.js';
import './multiselect-btns.js';
import './afs-empty-list-placeholder.js';


export const ListOverlayMixin = superClass => {
  return class ListOverlayMixin extends superClass {    


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

	      _dataEmpty: {
	      	type: Boolean,
	      	value: true,
	      	computed: '__computeDataEmpty(data)'
	      },

	      // Set to true to hide <select-checkbox>'s
	      _hideCheckboxes: {
	        type: Boolean,
	        value: true
	      },

	      _hidePlaceholder: {
	      	type: Boolean,
	      	value: true,
	      	computed: '__computeHidePlaceholder(_dataEmpty, _opened)'
	      },

	      // Only run db item subscriptions when overlay is open.
	      _opened: Boolean

	    };
	  }


	  static get observers() {
	  	return [

	  		// NOT using _opened as a dependency here.
	  		// This only should be triggered by a change in '_dataEmpty',
	  		// otherwise, this will close the overlay each time
	  		// the user opens it, which is terrible.
	  		'__dataEmptyOpenedChanged(_dataEmpty)',
	  		'__openedChanged(_opened)'
	  	];
	  }


	  connectedCallback() {
	    super.connectedCallback();

	    this.__itemSelected = this.__itemSelected.bind(this);

	    this.addEventListener('item-selected', this.__itemSelected);
	  }


	  disconnectedCallback() {
	    super.disconnectedCallback();

	    this.removeEventListener('item-selected', this.__itemSelected);
	  }


	  __computeDataEmpty(data) {
	  	if (data && typeof data === 'object' && Object.keys(data).length > 0) {
	  		return false;
	  	}

	  	return true;
	  }


	  __computeHidePlaceholder(empty, opened) {
	  	return !Boolean(empty && opened);
	  }

	  // NOT using _opened as a dependency here.
	  // This only should be triggered by a change in '_dataEmpty',
	  // otherwise, this will close the overlay each time
	  // the user opens it, which is terrible.
	  async __dataEmptyOpenedChanged(empty) {
	  	if (!empty || !this._opened) {
	  		return;
	  	}

	  	// Automatically close the overlay 
	  	// if all items have been deleted.
	  	if (empty && this._opened) {

	  		// Make sure the dom has been cleared first,
	  		// otherwise, the items will be visible for
	  		// a split second upon reopening.
	  		await listenOnce(this, 'app-file-system-list-items-dom-changed');

	  		this.$.overlay.reset();
	  	}
	  }

	  // Control memory footprint by removing 
	  // "heavy" elements when not in use.
	  __openedChanged(opened) {
	  	if (!opened) {
	  		this.fire('list-overlay-closed');
	  	}
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


	  delete() {
	    this.$.multi.delete();
	  }

  };
};
