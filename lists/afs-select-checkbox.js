
/**
  * `afs-select-checkbox`
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './afs-select-checkbox.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/paper-checkbox/paper-checkbox.js';


class AFSSelectCheckbox extends AppElement {

  static get is() { return 'afs-select-checkbox'; }

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

    this.__clicked = this.__clicked.bind(this);

    this.addEventListener('click', this.__clicked);
  }


  disconnectedCallback() {

    super.connectedCallback();

    this.removeEventListener('click', this.__clicked);
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

window.customElements.define(AFSSelectCheckbox.is, AFSSelectCheckbox);
