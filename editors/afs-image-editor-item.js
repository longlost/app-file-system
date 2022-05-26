

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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import htmlString         from './afs-image-editor-item.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import './afs-image-editor-icons.js';


class AFSImageEditorItem extends AppElement {
  
  static get is() { return 'afs-image-editor-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      buttonDisabled: Boolean,

      buttonIcon: String,

      buttonLabel: String,

      _icon: {
        type: String,
        computed: '__computeIcon(buttonIcon)'
      }

    };
  }


  __computeIcon(str) {

    return `afs-image-editor-icons:${str}`;
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
