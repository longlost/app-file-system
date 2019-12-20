
/**
 	* `list-icon-button`
 	* 
 	*  	Icon button with a badge that animates when files are being uploaded and processed in the cloud.
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
import '../shared/file-icons.js';


class ListIconButton extends AppElement {
  static get is() { return 'list-icon-button'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      list: String,

      // _animate: {
      //   type: Boolean,
      //   value: false,
      //   computed: '__computeAnimate(item)'
      // },

      _icon: {
      	type: String,
      	computed: '__computeIcon(list)'
      }

    };
  }


  static get observers() {
    return [
      '__animateChanged(_animate)'
    ];
  }


  __computeIcon(list) {  	
  	switch (list) {
  		case 'rearrange-list':
  			return 'file-icons:apps';
			case 'camera-roll':
				return 'file-icons:dashboard';
			default:
				return 'file-icons:apps';
  	}
  }

  // animate from upload through final processing
  __computeAnimate(item) {
    if (!item || 'type' in item === false) { return false; }
    // animate during image processing as well
    if (item.type.includes('image')) {
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


  async __btnClicked() {
    try {
      await this.clicked();
      this.fire('list-icon-button-clicked');
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(ListIconButton.is, ListIconButton);
