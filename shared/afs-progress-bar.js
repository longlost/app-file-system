
/**
  * `afs-progress-bar`
  * 
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-core/app-element.js';
import {schedule, wait}   from '@longlost/app-core/utils.js';
import htmlString         from './afs-progress-bar.html';
import '@longlost/paper-gauge/paper-gauge.js';
import '@polymer/paper-progress/paper-progress.js';


class AFSProgressBar extends AppElement {
  static get is() { return 'afs-progress-bar'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      fromBottom: Boolean,

      processed: {
        type: Number,
        value: 0
      },

      processing: {
        type: Number,
        value: 0
      },

      read: {
        type: Number,
        value: 0
      },

      reading: {
        type: Number,
        value: 0
      },

      _indeterminate: {
        type: Boolean,
        value: false
      }

    };
  }


  __computeNotUsedClass(max) {
    return max > 0 ? '' : 'not-used';
  }


  async hide() {
    if (!this._indeterminate) { return; } // Already hidden.

    this.style['transform'] = '';

    await wait(350);

    this._indeterminate   = false;
    this.style['display'] = 'none';

    return schedule();
  }


  async show() {
    if (this._indeterminate) { return; } // Already shown.

    this._indeterminate   = true;
    this.style['display'] = 'flex';

    await schedule();

    const translation = this.fromBottom ? 'calc(-100% - 16px)' : `100%`;

    this.style['transform'] = `translateY(${translation})`;

    return wait(350);
  }

}

window.customElements.define(AFSProgressBar.is, AFSProgressBar);
