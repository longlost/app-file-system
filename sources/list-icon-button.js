
/**
  * `list-icon-button`
  * 
  *   Icon button with a badge that animates when files are being uploaded and processed in the cloud.
  *
  *
  *  properites:
  *
  *  
  *    data - Object of file data objects that drives animation timing.
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
import {
  allProcessingRan,
  isCloudProcessable
}                 from '../shared/utils.js';
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

      // Total number of file items saved in db.
      count: Number,

      // Object form of database items.
      data: Object,

      // Determines which icon is shown for the <paper-icon-button>
      list: String,

      // Uploading arrow animation state.
      _animateArrow: {
        type: Boolean,
        value: false,
        computed: '__computeAnimateArrow(_items)'
      },

      // Cloud processing gear animation state.
      _animateGear: {
        type: Boolean,
        value: false,
        computed: '__computeAnimateGear(_items)'
      },

      _icon: {
        type: String,
        computed: '__computeIcon(list)'
      },

      // File object collection.
      _items: {
        type: Array,
        computed: '__computeItems(data)'
      },

      _show: {
        type: Boolean,
        computed: '__computeShow(count)'
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
        return 'file-icons:dashboard-90';
      case 'photos':
        return 'file-icons:apps';
      default:
        return 'file-icons:dashboard-90';
    }
  }


  __computeItems(data) {
    return data ? Object.values(data) : undefined;
  }

  // animate from upload through final processing
  __computeAnimateArrow(items) {
    if (!Array.isArray(items) || items.length === 0) { return false; }

    const shouldAnimate = items.some(item => 
                            item._tempUrl && !item.original);

    return shouldAnimate;
  }

  // animate from upload through final processing
  __computeAnimateGear(items) {
    if (!Array.isArray(items) || items.length === 0) { return false; }

    const shouldAnimate = items.some(item => 
      isCloudProcessable(item) && 
      item.original && 
      !allProcessingRan(item)
    );

    return shouldAnimate;
  }


  __computeShow(count) {
    return typeof count === 'number' && count > 0;
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
