
/**
  * `list-icon-button`
  * 
  *   Icon button with a badge that animates when files are being uploaded and processed in the cloud.
  *
  *
  *  properites:
  *
  *  
  *    items - Array of file data objects that drives animation timing.
  * 
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  schedule,
  wait
}                 from '@longlost/utils/utils.js';
import htmlString from './list-icon-button.html';
import '@longlost/app-icons/app-icons.js';
import '@longlost/badged-icon-button/badged-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/file-icons.js';


class ListIconButton extends AppElement {
  static get is() { return 'list-icon-button'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // File object collection.
      items: Array,

      // Determines which icon is shown for the <paper-icon-button>
      list: String,

      // Uploading arrow animation state.
      _animateArrow: {
        type: Boolean,
        value: false,
        computed: '__computeAnimateArrow(items)'
      },

      // Cloud processing gear animation state.
      _animateGear: {
        type: Boolean,
        value: false,
        computed: '__computeAnimateGear(items)'
      },

      _count: {
        type: Number,
        computed: '__computeCount(items)'
      },

      _icon: {
        type: String,
        computed: '__computeIcon(list)'
      },

      _show: {
        type: Boolean,
        computed: '__computeShow(items)'
      }

    };
  }


  static get observers() {
    return [
      '__animateArrowChanged(_animateArrow)',
      '__animateGearChanged(_animateGear)'
    ];
  }


  __computeIcon(list) {
    switch (list) {
      case 'files':
        return 'file-icons:apps';
      case 'photos':
        return 'file-icons:dashboard-90';
      default:
        return 'file-icons:apps';
    }
  }

  // animate from upload through final processing
  __computeAnimateArrow(items) {
    if (!Array.isArray(items) || items.length === 0) { return false; }

    const shouldAnimate = items.some(item => 
      '_tempUrl' in item && 
      'original' in item === false
    );

    return shouldAnimate;
  }

  // animate from upload through final processing
  __computeAnimateGear(items) {
    if (!Array.isArray(items) || items.length === 0) { return false; }

    const shouldAnimate = items.some(item => 
      item.type.includes('image') && 
      'original'  in item && 
      'optimized' in item === false
    );

    return shouldAnimate;
  }


  __computeCount(items) {
    if (!Array.isArray(items)) { return; }
    return items.length;
  }


  __computeShow(items) {
    return Array.isArray(items) && items.length > 0;
  }


  __startArrowAnimation() {
    this.$.arrow.classList.add('start-arrow');
    this.$.count.classList.add('start-count');
  }


  __stopArrowAnimation() {
    this.$.arrow.classList.remove('start-arrow');
    this.$.count.classList.remove('start-count');
  }


  __animateArrowChanged(animate) {
    if (animate) {
      this.__startArrowAnimation();
    }
    else {
      this.__stopArrowAnimation();
    }
  }


  async __startGearAnimation() {
    this.$.gear.classList.add('show-gear');
    await wait(450);
    this.$.gear.classList.add('start-gear');
  }


  async __stopGearAnimation() {
    this.$.gear.classList.remove('start-gear');
    await schedule();
    this.$.gear.classList.remove('show-gear');
  }


  __animateGearChanged(animate) {
    if (animate) {
      this.__startGearAnimation();
    }
    else {
      this.__stopGearAnimation();
    }
  }

}

window.customElements.define(ListIconButton.is, ListIconButton);
