
/**
  * `processing-icon`
  * 
  *  Animated icon that helps illustrate that a file is being processed in the cloud.
  *
  *
  *  properites:
  *
  *  
  *    item - file data object that drives animation timing
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
import htmlString from './processing-icon.html';
import '@longlost/app-icons/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';


class ProcessingIcon extends AppElement {
  static get is() { return 'processing-icon'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      _animate: {
        type: Boolean,
        value: false,
        computed: '__computeAnimate(item)'
      }

    };
  }


  static get observers() {
    return [
      '__animateChanged(_animate)'
    ];
  }

  // animate from upload through final processing
  __computeAnimate(item) {
    if (!item || 'type' in item === false) { return false; }

    const {type} = item;

    // animate during image processing as well
    if (
      type.includes('image') && 
      (type.includes('jpeg') || type.includes('jpg') || type.includes('png'))
    ) {
      return 'original' in item && 'optimized' in item === false;
    }

    // Other file types don't have futher processing
    // so we are done animating.  
    return 'original' in item === false;
  }


  async __animateChanged(animate) {

    if (animate) {
      this.style['display'] = 'block';
      await wait(500); // Wait for <upload-controls> to hide.
      this.__startAnimation();
    }
    else {
      await this.__stopAnimation();
      this.style['display'] = 'none';
    }
  }


  __startAnimation() {
    this.style['transform'] = 'scale(1, 1)';
    this.$.gear.classList.add('start');
  }


  async __stopAnimation() {
    this.style['transform'] = 'scale(0, 0)';
    this.$.gear.classList.remove('start');
    await wait(250);
  }

}

window.customElements.define(ProcessingIcon.is, ProcessingIcon);
