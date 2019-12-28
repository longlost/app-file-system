
/**
  * `select-checkbox`
  * 
  *   This checkbox is used to select multiple preview items.
  *
  *
  *
  *
  *  Properites:
  *
  *
  *   checked: Boolean - <paper-checkbox> checked state.
  *
  *
  *
  *   
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString         from './select-checkbox.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-checkbox/paper-checkbox.js';


class SelectCheckbox extends AppElement {
  static get is() { return 'select-checkbox'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      checked: Boolean

    };
  }


}

window.customElements.define(SelectCheckbox.is, SelectCheckbox);
