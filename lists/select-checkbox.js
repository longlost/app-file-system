
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

      checked: {
        type: Boolean,
        value: false,
        reflectToAttribute: true // For css selector.
      },

      hidden: Boolean

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.__clicked.bind(this));
  }


  disconnectedCallback() {
    super.connectedCallback();

    this.removeEventListener('click', this.__clicked.bind(this));
  }


  async __clicked() {
    try {

      await this.clicked();
      
      this.fire('value-changed', {value: !this.checked});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


}

window.customElements.define(SelectCheckbox.is, SelectCheckbox);
