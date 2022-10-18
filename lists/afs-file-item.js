
/**
  * `afs-file-item`
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


import {AppElement}    from '@longlost/app-core/app-element.js';
import {FileInfoMixin} from '../shared/file-info-mixin.js';
import {ItemMixin}     from './item-mixin.js';
import template        from './afs-file-item.html';
import '@longlost/app-core/app-icons.js';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './afs-quick-options.js';


class AFSFileItem extends ItemMixin(FileInfoMixin(AppElement)) {
  
  static get is() { return 'afs-file-item'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      // <drag-drop-list> sort correction number.
      stateIndex: Number

    };
  }


  __computeSortableClass(type) {

    if (type && type.includes('video')) {
      return 'video';
    }
    return '';
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

  
  async __moreBtnClicked() {

    try {
      await this.clicked();
      
      this.$.moreBtn.blur();
      this.$.options.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AFSFileItem.is, AFSFileItem);
