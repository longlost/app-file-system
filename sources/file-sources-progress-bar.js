
/**
  * `file-sources-progress-bar`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-element/app-element.js';
import {schedule, wait} 	from '@longlost/utils/utils.js';
import htmlString 				from './file-sources-progress-bar.html';
import '@longlost/paper-gauge/paper-gauge.js';
import '@polymer/paper-progress/paper-progress.js';


class FileSourcesProgressBar extends AppElement {
  static get is() { return 'file-sources-progress-bar'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

    	processed: {
    		type: Number,
    		value: 0
    	},

    	processing: {
    		type: Number,
    		value: 0
    	},

    	read: {
    		type: Number,
    		value: 0
    	},

    	reading: {
    		type: Number,
    		value: 0
    	},

    	_indeterminate: {
    		type: Boolean,
    		value: false
    	}

    };
  }


  __computeNotUsedClass(max) {
  	return max > 0 ? '' : 'not-used';
  }


  async hide() {
    if (!this._indeterminate) { return; } // Already hidden.

  	this.style['transform'] = '';

  	await wait(350);

  	this._indeterminate 	= false;
  	this.style['display'] = 'none';
  }


  async show() {
    if (this._indeterminate) { return; } // Already shown.

  	this._indeterminate 	= true;
  	this.style['display'] = 'flex';

  	await schedule();

  	this.style['transform'] = 'translateY(100%)';
  }

}

window.customElements.define(FileSourcesProgressBar.is, FileSourcesProgressBar);
