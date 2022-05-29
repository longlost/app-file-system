

/**
  * `afs-image-adjuster`
  * 
  *   
  *   Alter the appearance of an imput image with simple adjustments.
  *
  *
  *
  *  Properites:
  *
  *
  *     item - Required. Image file db object.    
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


import {AppElement}                from '@longlost/app-core/app-element.js';
import {scale}                     from '@longlost/app-core/lambda.js';
import {getRootTarget, wait, warn} from '@longlost/app-core/utils.js';
import {ImageEditorItemMixin}      from './image-editor-item-mixin.js';
import {FilterMixin}               from './filter-mixin.js';
import {imgFilterFile}             from '../shared/utils.js';
import template                    from './afs-image-adjuster.html';
import '@longlost/app-core/app-shared-styles.css';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import './afs-image-editor-icons.js';
import './afs-image-editor-item.js';


class AFSImageAdjuster extends FilterMixin(ImageEditorItemMixin(AppElement)) {
  
  static get is() { return 'afs-image-adjuster'; }

  static get template() {
    return template;
  }


  static get properties() {
    return {

      _blur: Number,

      _brightness: Number,

      _centeredVal: {
        type: Number,
        value: 50
      },

      _contrast: Number,

      // Preview canvas 2d context reference.
      _ctx: Object,

      _hue: Number,

      _ready: Boolean,

      _readyForSource: {
        type: Boolean,
        value: false,
        computed: '__computeReadyForSource(_filter, _src)',
        observer: '__readyForSourceChanged'
      },

      _saturation: Number,

      // Scaler function for brightnes, contrast and saturation.
      _scaler: Object,

      _sharpness: Number,

      // Javascript Image object.
      _source: Object,

      // Used in _name computed method.
      _type: {
        type: String,
        value: 'adjusted',
        readOnly: true
      },

      _zeroedVal: {
        type: Number,
        value: 0
      }

    };
  }


  static get observers() {
    return [
      '__adjustmentsChanged(_filter, _source, _brightness, _contrast, _saturation, _hue, _sharpness, _blur)',
      '__readySrcChanged(_ready, _src)'
    ];
  }


  connectedCallback() {

    super.connectedCallback();

    this._ctx = this.$.preview.getContext('2d');

    // Scale args -> inputMin, inputMax, outputMin, outputMax, input.
    this._scaler = scale(0, 100, -1, 1);
  }


  __computeReadyForSource(filter, src) {

    return Boolean(filter && src);
  }


  __adjustmentsChanged(filter, source, brightness, contrast, saturation, hue, sharpness, blur) {

    if (!filter || !source) { return; }

    window.requestAnimationFrame(() => {

      filter.reset();

      filter.addFilter('brightness', brightness || 0);
      filter.addFilter('contrast',   contrast   || 0);
      filter.addFilter('saturation', saturation || 0);
      filter.addFilter('hue',        hue        || 0);
      filter.addFilter('sharpen',    sharpness  || 0);
      filter.addFilter('blur',       blur       || 0);

      const canvas = filter.apply(source);

      this._ctx.drawImage(canvas, 0, 0);

      // Undefined during initialization and clearing.
      if (
        brightness === undefined && 
        contrast   === undefined && 
        saturation === undefined && 
        hue        === undefined && 
        sharpness  === undefined && 
        blur       === undefined
      ) { return; }

      // Enable 'Apply' button.
      this._selectedFilter = 'selected';
    });    
  }

  // MUST check oldVal to avoid this 
  // running twice during initialization.
  __readyForSourceChanged(newVal, oldVal) {

    if (typeof oldVal === 'undefined') { return; }

    if (!newVal) { return; }

    this._ready = true;    
  }


  __readySrcChanged(ready, src) {

    if (!ready || !src || src === '#') { return; }

    const img = new Image();
  
    img.onload = () => {

      this.$.preview['height'] = `${img.height}`;
      this.$.preview['width']  = `${img.width}`;

      this._source = img;

      this.fire('image-adjuster-loaded');
    };

    img.onerror = () => {
      this._source = undefined;
    };

    // MUST set crossorigin to allow WebGL to securely load the downloaded image.
    img.crossOrigin = 'anonymous';
    img.src         = this._src;
    this._source    = undefined;
  }


  __clear() {

    this.__reset();

    // Change ready val.
    this._ready = undefined;

    // Reset ready so _source is renewed.
    // This addresses and issue where blurring
    // a cropped image creates a halo that is
    // larger than the image. Renewing the _source
    // clears the halo artifact.
    this._ready = true;
  }

  // Called by image-editor-item-mixin
  // when the editedSrc is changed.
  __reset() {

    // Change slider default values.
    this._centeredVal = undefined;
    this._zeroedVal   = undefined;

    // Don't allow filters to run
    // until a new source is established.
    this._source = undefined;

    // Disable 'Apply' button.
    this._selectedFilter = undefined;

    // Reset filters.
    this._brightness = undefined;
    this._contrast   = undefined;
    this._saturation = undefined; 
    this._hue        = undefined;
    this._sharpness  = undefined; 
    this._blur       = undefined;

    // Force an update to reset sliders.
    this._centeredVal = 50;
    this._zeroedVal   = 0;
  }


  __brightnessChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value}    = event.detail;
      this._brightness = this._scaler(value);
    });
  }


  __contrastChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value}  = event.detail;
      this._contrast = this._scaler(value);
    });
  }


  __saturationChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value}    = event.detail;
      this._saturation = this._scaler(value);
    });
  }


  __hueChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value} = event.detail;
      this._hue     = value;
    });
  }


  __sharpenChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value}   = event.detail;
      this._sharpness = value / 100;
    });
  }


  __blurChanged(event) {

    const {focused} = getRootTarget(event);

    // Ignore if not by human interaction.
    if (!focused) { return; }

    window.requestAnimationFrame(() => {
      const {value} = event.detail;
      this._blur    = value / 2;
    });
  }


  async __clearClicked() {

    try {
      await this.clicked();

      this.__clear();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __applyClicked() {

    try {

      this.fire('image-adjuster-show-spinner', {text: 'Applying adjustments.'});

      // Wait for spinner entry.
      await wait(300);

      const process = async () => {
        const low  = await imgFilterFile(this._filter, this._src,        this._name, this.ext);
        const high = await imgFilterFile(this._filter, this.highQuality, this._name, this.ext);

        return {high, low};
      };
    
      const [detail] = await Promise.all([
        process(),
        wait(1200)
      ]);

      this.fire('image-adjuster-adjustments-applied', detail);
    }
    catch (error) {
      console.error(error);
      await warn('Could not apply the adjustments.');
    }
    finally {
      this.fire('image-adjuster-hide-spinner');
    }
  }

}

window.customElements.define(AFSImageAdjuster.is, AFSImageAdjuster);
