
/**
  * `afs-processing-error-icon`
  * 
  *  An icon-button that informs user of any failed cloud post-processing.
  *
  *
  *  properites:
  *
  *  
  *    item - File data object that determines this element's state.
  * 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html}   from '@longlost/app-core/app-element.js';
import {isCloudProcessable} from '@longlost/app-core/img-utils.js';
import htmlString           from './afs-processing-error-icon.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-menu-button/paper-menu-button.js';


class AFSProcessingErrorIcon extends AppElement {
  static get is() { return 'afs-processing-error-icon'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      _errors: {
        type: Array,
        computed: '__computeErrors(item)'
      },

      _show: {
        type: Boolean,
        value: false,
        computed: '__computeShow(item)'
      }

    };
  }


  static get observers() {
    return [
      '__showChanged(_show)'
    ];
  }


  __computeErrors(item) {
    if (!item) { return; }

    const {optimizedError, posterError, thumbnailError, type} = item;

    const kind = type.includes('image') ? 'version' : 'poster';   

    const optim  = optimizedError ? `Optimized ${kind} failed.`     : undefined;
    const poster = posterError    ? `High fidelity ${kind} failed.` : undefined;
    const thumb  = thumbnailError ? `Thumbnail ${kind} failed.`     : undefined;

    return [thumb, optim, poster].filter(str => str);
  }

  // animate from upload through final processing
  __computeShow(item) {

    // Animate during image processing as well.
    if (item && isCloudProcessable(item)) {

      const {optimizedError, posterError, thumbnailError} = item;

      return optimizedError || posterError || thumbnailError;
    }

    // Other file types don't have post-processing
    // so do not show.  
    return false;
  }


  __showChanged(show) {

    if (show) {
      this.style['display'] = 'block';
    }
    else {
      this.style['display'] = 'none';
    }
  }


  async __dropdownClicked() {
    try {
      await this.clicked();

      this.$.menu.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(AFSProcessingErrorIcon.is, AFSProcessingErrorIcon);
