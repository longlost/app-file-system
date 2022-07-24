

/**
  * `afs-image-editor-item`
  * 
  *   
  *   Common layout, styles and functionality for all image editor pages.
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
  *  Events:
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement} from '@longlost/app-core/app-element.js';
import template     from './afs-image-editor-item.html';
import '@longlost/app-core/app-shared-styles.css';
import './afs-image-editor-icons.js';
import './afs-image-editor-item-btn.js';


class AFSImageEditorItem extends AppElement {
  
  static get is() { return 'afs-image-editor-item'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      buttonDisabled: Boolean,

      buttonIcon: String,

      buttonLabel: String,

      buttonPlacement: {
        type: String,
        value: 'over-preview' // Or 'after-content'
      },

      _hideAfterContentButton: {
        type: Boolean,
        value: true,
        computed: '__computeHideAfterContentButton(buttonPlacement)'
      }

    };
  }


  __computeHideAfterContentButton(placement) {

    return placement !== 'after-content';
  }


  async __btnClicked() {

    try {
      await this.clicked();

      this.fire('image-editor-item-btn-clicked');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AFSImageEditorItem.is, AFSImageEditorItem);
