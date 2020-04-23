
/**
  * `ItemMixin`
  * 
  *   Common logic that is shared by file-item and roll-item.
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


import '../shared/file-thumbnail.js';
import './processing-error-icon.js';
import './processing-icon.js';
import './select-checkbox.js';
import './upload-controls.js';


export const ItemMixin = superClass => {
  return class ItemMixin extends superClass {    


	  static get properties() {
	    return {

	      // Firestore coll path string.
	      coll: String,

	      hideCheckbox: Boolean,
      
	      // File item object.
	      item: Object,

	      // File upload controls, progress and state.
	      uploads: Object,

	      // Selected/checked state.
	      // Passed into <select-checkbox>
	      selected: {
	        type: Boolean,
	        value: false
	      },

	      // Lazy-video controls.
	      _controls: {
	        type: Boolean,
	        value: false
	      },

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
	      '__hideCheckboxChanged(hideCheckbox)',
	      '__itemChanged(item)',
	      '__selectedChanged(selected)',
	      '__uploadChanged(_upload)'
	    ];
	  }

  
	  __hideCheckboxChanged(hide) {
	    if (hide) {
	      this.selected = false;
	    }
	  }


	  __itemChanged() {
	    this.selected = false;
	  }


	  __selectedChanged(selected) {
	    this.fire('item-selected', {
	      item: this.item, 
	      selected
	    });
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


	  __selectCheckboxValChanged(event) {
	    this.selected = event.detail.value;
	  }

  };
};
