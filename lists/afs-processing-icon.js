
/**
  * `afs-processing-icon`
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

import {AppElement} from '@longlost/app-core/app-element.js';

import {
  schedule,
  wait
} from '@longlost/app-core/utils.js';

import {
  allProcessingRan,
  isCloudProcessable
} from '@longlost/app-core/img-utils.js';

import template from './afs-processing-icon.html';
import '@longlost/app-core/app-icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../shared/afs-file-icons.js';


class AFSProcessingIcon extends AppElement {

  static get is() { return 'afs-processing-icon'; }

  static get template() {
    return template;
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

    if (!item || !item.type) { return false; }

    // Animate during image processing as well.
    if (isCloudProcessable(item)) {
      return item.original && !allProcessingRan(item);
    }

    // Other file types don't have futher post-processing
    // so we are done animating.  
    return false;
  }


  __animateChanged(animate) {

    if (animate) {
      this.__startAnimation();
    }
    else {
      this.__stopAnimation();
    }
  }


  async __startAnimation() {

    this.style['display'] = 'block';

    // Wait for <upload-controls> to hide.
    await wait(500); 

    this.style['transform'] = 'scale(1, 1)';
    this.$.gear.classList.add('rotate');
  }


  async __stopAnimation() {
    
    this.style['transform'] = 'scale(0, 0)';
    this.$.gear.classList.remove('rotate');

    await wait(250);

    this.style['display'] = 'none';
  }

}

window.customElements.define(AFSProcessingIcon.is, AFSProcessingIcon);
