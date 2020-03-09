
/**
  * `ItemsMixin`
  * 
  *   Common logic that is shared by file-items and roll-items.
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
  *    uploads - <Object> required: File upload objects data bound from <file-sources>.
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




export const ItemsMixin = superClass => {
  return class ItemsMixin extends superClass {    


	  static get properties() {
	    return {

	      // From tri-state multiselect-btns.
	      // Select all item checkboxes when true.
	      all: Boolean,

	      // Firestore coll path string.
	      coll: String,

	      // Set to true to hide <file-item> <select-checkbox>'s
	      hideCheckboxes: Boolean,

	      // Only run db item subscriptions when overlay is open.
	      opened: Boolean,

	      // File upload controls, progress and state.
	      uploads: Object,

	      // Last snapshot doc from each pagination.
	      // Drives outer template repeater.
	      _paginations: {
	        type: Array,
	        value: [null]
	      }

	    };
	  }


	  __newPaginationDoc(event) {
	    const {doc, index} = event.detail;

	    // Add/replace current pagination 
	    // doc into paginations array.
	    this.splice('_paginations', index + 1, 1, doc);
	  }

  };
};
