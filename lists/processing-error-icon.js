
/**
  * `processing-error-icon`
  * 
  *  An icon-button that informs user of any failed cloud post-processing.
  *
  *
  *  properites:
  *
  *  
  *    item - File data object that determines this element's state.
  * 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html}  	from '@longlost/app-element/app-element.js';
import {isCloudProcessable} from '../shared/utils.js';
import htmlString 					from './processing-error-icon.html';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-menu-button/paper-menu-button.js';


class ProcessingErrorIcon extends AppElement {
  static get is() { return 'processing-error-icon'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      _errors: {
      	type: Array,
      	computed: '__computeErrors(item)'
      },

      _show: {
        type: Boolean,
        value: false,
        computed: '__computeShow(item)'
      }

    };
  }


  static get observers() {
    return [
      '__showChanged(_show)'
    ];
  }


  __computeErrors(item) {
  	if (!item) { return; }

  	const {optimizedError, orientedError, thumbnailError, type} = item;

  	const kind = type.includes('image') ? 'version' : 'poster';  	

  	const optim  = optimizedError ? `Optimized ${kind} failed.` 		: undefined;
		const orient = orientedError  ? `High fidelity ${kind} failed.` : undefined;
		const thumb  = thumbnailError ? `Thumbnail ${kind} failed.` 		: undefined;

		return [thumb, optim, orient].filter(str => str);
  }

  // animate from upload through final processing
  __computeShow(item) {

    // Animate during image processing as well.
    if (item && isCloudProcessable(item)) {

    	const {optimizedError, orientedError, thumbnailError} = item;

      return optimizedError || orientedError || thumbnailError;
    }

    // Other file types don't have post-processing
    // so do not show.  
    return false;
  }


  __showChanged(show) {

    if (show) {
      this.style['display'] = 'block';
    }
    else {
      this.style['display'] = 'none';
    }
  }


  async __dropdownClicked() {
  	try {
  		await this.clicked();

  		this.$.menu.close();
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  	}
  }

}

window.customElements.define(ProcessingErrorIcon.is, ProcessingErrorIcon);