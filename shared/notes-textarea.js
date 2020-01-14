
/**
  * `notes-textarea`
  * 
  *   Custom styled paper-textarea element that allows an iron image prefix icon
  * 	just like paper-input's.
  *
  *
  *
  *  Properites:
  *
  *  
  *    notes - <String> required: File item notes string value.
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


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './notes-textarea.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-input/paper-textarea.js';
import '../shared/file-icons.js';


class NotesTextarea extends AppElement {
  static get is() { return 'notes-textarea'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      
      // File item notes string.
      notes: Object,

      _focused: Boolean

    };
  }


  __focusedChanged(event) {
  	this._focused = event.detail.value;
  }


  __valueChanged(event) {
  	this.fire('notes-changed', {value: event.detail.value.trim()});
  }

}

window.customElements.define(NotesTextarea.is, NotesTextarea);
