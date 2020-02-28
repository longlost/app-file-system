
/**
  * `file-item`
  * 
  *   File preview item that displays a thumbnail, file stats and upload controls.
  *
  *
  * @implements ItemMixin
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {FileInfoMixin}    from '../shared/file-info-mixin.js';
import {ItemMixin}        from './item-mixin.js';
import htmlString         from './file-item.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './quick-options.js';


class FileItem extends ItemMixin(FileInfoMixin(AppElement)) {
  static get is() { return 'file-item'; }

  static get template() {
    return html([htmlString]);
  }


  __computeStatsLine2(mimeExt, sizeStr) {
    if (!mimeExt) { return sizeStr; }

    return `${mimeExt} ● ${sizeStr}`;
  }

  // Overwrite ItemMixin base class method.
  __hideCheckboxChanged(hide) {
    
    if (hide) {
      this.selected = false;
    }
    else {
      this.$.options.close();
    }
  }

  
  async __moreBtnClicked(event) {
    try {

      await this.clicked();

      this.$.options.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(FileItem.is, FileItem);
