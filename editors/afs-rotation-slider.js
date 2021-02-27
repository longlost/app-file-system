

/**
  * `afs-rotation-slider`
  * 
  *   
  *   Slide-to-rotate image custom ui.
  *
  *
  *
  *  Properites:
  *
  *
  *     
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *    
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-core/app-element.js';
import {schedule}         from '@longlost/app-core/utils.js';
import htmlString         from './afs-rotation-slider.html';


// The total slider travel represents +/- 45 degrees.
const TOTAL_DEGREES = 90;


class AFSRotationSlider extends AppElement {

  static get is() { return 'afs-rotation-slider'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _increment: {
        type: Number,
        computed: '__computeIncrement(_width)'
      },

      // ResizeObserver instance.
      _resizeObserver: Object,

     _width: Number

    };
  }


  async connectedCallback() {

    super.connectedCallback();

    this.__measureWidth = this.__measureWidth.bind(this);

    await schedule();

    this.__measureWidth();

    // Center the scroller initially.
    this.center();

    this._resizeObserver = new window.ResizeObserver(this.__measureWidth);

    this._resizeObserver.observe(this);
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }


  __computeIncrement(width) {

    return typeof width === 'number' ? width / TOTAL_DEGREES : 1;
  }


  __measureWidth() {

    this._width  = this.$.scale.getBoundingClientRect().width;
    this._center = this._width / 2;
  }


  async __scrollerScrolled() {

    await schedule();

    const dist    = this.$.scroller.scrollLeft - this._center;
    this._degrees = Math.round(dist / this._increment);

    this.fire('degrees-changed', {value: this._degrees});
  }


  center() {

    this.$.scroller.scroll(this._center, 0);
  }

}

window.customElements.define(AFSRotationSlider.is, AFSRotationSlider);
