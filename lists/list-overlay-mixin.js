
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


import {hijackEvent, listen, unlisten} from '@longlost/utils/utils.js';
import './multiselect-btns.js';


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

	      // Set to true to hide <select-checkbox>'s
	      _hideCheckboxes: {
	        type: Boolean,
	        value: true
	      },

	      // Only run db item subscriptions when overlay is open.
	      _opened: Boolean

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
