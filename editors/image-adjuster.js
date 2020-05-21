

/**
  * `image-adjuster`
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


import {AppElement, html}     from '@longlost/app-element/app-element.js';
import {ImageEditorItemMixin} from './image-editor-item-mixin.js';
import {FilterMixin}          from './filter-mixin.js';
import {scale}                from '@longlost/lambda/lambda.js';
import {wait, warn}           from '@longlost/utils/utils.js';
import {highQualityFile}      from '../shared/utils.js';
import htmlString             from './image-adjuster.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import './image-editor-item.js';


class ImageAdjuster extends FilterMixin(ImageEditorItemMixin(AppElement)) {
  static get is() { return 'image-adjuster'; }

  static get template() {
    return html([htmlString]);
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
      '__adjustmentsChanged(_filter, _source, _brightness, _contrast, _saturation, _hue, _sharpness, _blur)'
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

      filter.addFilter('brightness', brightness);
      filter.addFilter('contrast',   contrast);
      filter.addFilter('saturation', saturation);
      filter.addFilter('hue',        hue);
      filter.addFilter('sharpen',    sharpness);
      filter.addFilter('blur',       blur);

      const canvas = filter.apply(source);

      this._ctx.drawImage(canvas, 0, 0);

      // Enable 'Apply' button.
      this._selectedFilter = 'selected';
    });    
  }

  // MUST check oldVal to avoid this 
  // running twice during initialization.
  __readyForSourceChanged(newVal, oldVal) {

    if (typeof oldVal === 'undefined') { return; }

    if (!newVal) { return; }

    const img = new Image();
  
    img.onload = () => {

      this.$.preview['height'] = `${img.height}`;
      this.$.preview['width']  = `${img.width}`;

      this._source = img;
    };

    img.onerror = () => {
      this._source = undefined;
    };

    // MUST set crossorigin to allow WebGL to securely load the downloaded image.
    img.crossOrigin = '';
    img.src         = this._src;
  }


  __reset() {
    if (this._filter) {
      this._centeredVal    = 50;     
      this._filter         = undefined;
      this._selectedFilter = undefined;
      this._zeroedVal      = 0;
    }
  }


  __brightnessChanged(event) {
    window.requestAnimationFrame(() => {
      const {value}    = event.detail;
      this._brightness = this._scaler(value);
    });
  }


  __contrastChanged(event) {
    window.requestAnimationFrame(() => {
      const {value}  = event.detail;
      this._contrast = this._scaler(value);
    });
  }


  __saturationChanged(event) {
    window.requestAnimationFrame(() => {
      const {value}    = event.detail;
      this._saturation = this._scaler(value);
    });
  }


  __hueChanged(event) {
    window.requestAnimationFrame(() => {
      const {value} = event.detail;
      this._hue     = value;
    });
  }


  __sharpenChanged(event) {
    window.requestAnimationFrame(() => {
      const {value}   = event.detail;
      this._sharpness = value / 100;
    });
  }


  __blurChanged(event) {
    window.requestAnimationFrame(() => {
      const {value} = event.detail;
      this._blur    = value / 2;
    });
  }


  async __applyClicked() {
    try {
    
      const [file] = await Promise.all([
        highQualityFile(
          this._filter, 
          this._highQuality, 
          this._name
        ),
        wait(2000)
      ]);

      this.fire('image-adjuster-adjustments-applied', {value: file});
    }
    catch (error) {
      console.error(error);
      await warn('Could not apply the adjustments.');
    }
    finally {
      this.$.item.hideSpinner();
    }
  }

}

window.customElements.define(ImageAdjuster.is, ImageAdjuster);
