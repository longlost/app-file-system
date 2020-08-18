
/**
  * `drop-zone`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/
  
import {AppElement, html} from '@longlost/app-element/app-element.js';
import {hijackEvent}      from '@longlost/utils/utils.js';
import htmlString         from './drop-zone.html';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/file-icons.js';


class DropZone extends AppElement {
  static get is() { return 'drop-zone'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      accept: String,

      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      maxsize: Number,

      maxfiles: Number,

      multiple: Boolean,

      unit: String,

      _feedbacks: {
        type: Object,
        value: {
          single:   'Sorry but you can only upload one file.',
          tooLarge: 'This file is too large, try a file smaller than {maxsize}{unit}.',
          tooMany:  'You can only upload {maxfiles} files.'
        }
      },

      // Data-binding to feedback span.
      _feedbackText: String,

      _instructions: {
        type: String,
        computed: '__computeInstructions(multiple)'
      }

    };
  }


  __computeInputAccept(accept) {
    if (!accept || accept === 'image') { return 'image/*'; }

    if (accept === 'audio') { return 'audio/*'; } 
    if (accept === 'video') { return 'video/*'; }

    return accept;
  }

  
  __computeInstructions(multiple) {
    return multiple ? 'DROP FILES HERE' : 'DROP FILE HERE';
  }

  // Disable clicks on droparea. There is a button for that.
  __labelClicked(event) {

    if (event.detail === 1) {
      hijackEvent(event);
    }
  }


  __highlight() {
    this.$.label.classList.add('highlight');
  }


  __unhighlight() {
    this.$.label.classList.remove('highlight');
  }


  __handleDragEnterAndOver(event) {
    hijackEvent(event);

    this.__highlight();
  }


  __handleDragLeave(event) {
    hijackEvent(event);

    this.__unhighlight();
  }


  __handleDrop(event) {
    hijackEvent(event);

    this.__unhighlight();
    this.__handleFiles(event.dataTransfer.files);
  }


  __handleChange(event) {
    this.__handleFiles(event.target.files);
  }


  __handleFiles(files) {
    
    // Make a true array.
    const array = [...files];
    this.fire('files-added', {files: array});
  }


  clearFeedback()  {
    this._feedbackText = '';
  }


  createFeedback(id) {
    let text = this._feedbacks[id];
    text = text.replace(/\{maxsize\}/,  this.maxsize);
    text = text.replace(/\{maxfiles\}/, this.maxfiles);
    text = text.replace(/\{unit\}/,     this.unit);
    this._feedbackText = text;
  }


  openChooser() {

    // HACK:
    //    The call to this.$.label.click makes this more reliable.

    this.$.label.click();    
    this.$.input.click();
  }

}

window.customElements.define(DropZone.is, DropZone);
