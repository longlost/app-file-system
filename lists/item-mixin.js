
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
  *    doc - <String> required: Firestore document path to use when saving.
  *           ie. `${program}`, 'home', `${uid}`
  *           default -> undefined
  *
  *
  *    field - <String> optional: Firestore document object field (prop) to save the file metadata/info.
  *            ie. 'backgroundImg', 'carousel', 'profileImg'
  *            default -> 'files'
  *
  *  
  *    item - <Object> required: File item data object.
  *
  *
  *
  *
  *  Methods: 
  *
  *   
  *   cancelUpload - Cancel an item upload mid-stream. Used when an item is deleted early.
  *
  *
  *   pauseUpload - Pause incomplete uploads when user is deciding to delete an item.
  *
  *
  *   resumeUpload - Resume an incomplete upload when a user dismisses the delete modal.
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import '../shared/file-thumbnail.js';
import './processing-icon.js';
import './select-checkbox.js';
import './upload-controls.js';


export const ItemMixin = superClass => {
  return class ItemMixin extends superClass {    


	  static get properties() {
	    return {

	      // Firestore coll path string.
	      coll: String,

	      // Firestore doc path string.
	      doc: String,

	      // Firestore document field to use for saving file data after processing.
	      // ie. 'backgroundImg', 'catImages', ...
	      field: {
	        type: String,
	        value: 'files'
	      },

	      hideCheckbox: Boolean,

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
	      }

	    };
	  }


	  static get observers() {
	    return [
	      '__hideCheckboxChanged(hideCheckbox)',
	      '__itemChanged(item)',
	      '__selectedChanged(selected)'
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


	  __selectCheckboxValChanged(event) {
	    this.selected = event.detail.value;
	  }

	  // Used for app-file-system.js deleteAll() method.
	  cancelUpload() {
	    this.$.uploadControls.cancel();
	  }


	  pauseUpload() {
	    this.$.uploadControls.pause();
	  }


	  resumeUpload() {
	    this.$.uploadControls.resume();
	  }

  };
};
