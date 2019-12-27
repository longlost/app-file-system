
/**
  * `select-checkbox`
  * 
  *   This checkbox is used to select multiple preview items.
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  *
  *  Properites:
  *
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
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString         from './select-checkbox.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@longlost/paper-checkbox/paper-checkbox.js';


class SelectCheckbox extends AppElement {
  static get is() { return 'select-checkbox'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

    	uid: String

    };
  }


  __checkedChanged(event) {
  	this.fire('select-checkbox-selected', {
  		selected: event.detail.value, 
  		uid: 			this.uid
  	});
  }


}

window.customElements.define(SelectCheckbox.is, SelectCheckbox);
