

import webglFilter from '@longlost/webgl-filter/webgl-filter.js';


export const FilterMixin = superClass => {
  return class FilterMixin extends superClass {

    static get properties() {
	    return {

	      _applyBtnDisabled: {
	      	type: Boolean,
	      	value: true,
	      	computed: '__computeApplyBtnDisabled(item, _filter, _selectedFilter)'
	      },

      	// 'webgl-filter' instance.
      	_filter: Object,

      	_selectedFilter: String

	    };
	  }


	  connectedCallback() {

	  	super.connectedCallback();

	  	this._filter = webglFilter();
	  }


	  __computeApplyBtnDisabled(item, filter, selectedFilter) {
	  	
	  	return !Boolean(item && filter && selectedFilter);
	  }

  };
};
