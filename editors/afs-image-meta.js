

/**
  * `afs-image-meta`
  * 
  *   
  *   A simple wrapper element for metadata-page that uses 
  *   ImageEditorMixin to control opacity when the element is being tabbed.
  *
  *
  *
  *  Properites:
  *
  *
  *     current - <String> Required. Currently visible tab page, tab-pages-page-changed event.   
  *
  *     page - <String> Required. The name of this page in tab sequence. 
  *
  *     selected - <String> Required. The name of the selected paper-tab.
  *
  *
  *
  *
  *    
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *   @implements ImageEditorItemMixin
  *
  **/


import {AppElement, html}     from '@longlost/app-core/app-element.js';
import {ImageEditorItemMixin} from './image-editor-item-mixin.js';


class AFSImageMeta extends ImageEditorItemMixin(AppElement) {
  static get is() { return 'afs-image-meta'; }

  static get template() {
    return html`

      <style>

        :host {
          display:          block;
          min-height:       100vh;
          background-color: var(--app-body-color);
        }

      </style>

      <slot></slot>

    `;
  }

}

window.customElements.define(AFSImageMeta.is, AFSImageMeta);
