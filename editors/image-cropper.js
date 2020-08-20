

/**
  * `image-cropper`
  * 
  *   
  *   Crop, rotate and zoom an imput image.
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


import {AppElement, html}       from '@longlost/app-element/app-element.js';
import {ImageEditorItemMixin}   from './image-editor-item-mixin.js';
import {listenOnce, wait, warn} from '@longlost/utils/utils.js';
import htmlString               from './image-cropper.html';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './image-editor-icons.js';
import './image-editor-item.js';
import './crop-wrapper.js';
import './rotation-slider.js';


// String --> Number/undefined
// A helper function that converts
// an aspect dom element name
// to the appropriate number form
// for crop-wrapper.
const getRatio = name => {
  switch (name) {
    case 'free':
      return undefined;
    case '16:9':
      return 16 / 9;
    case '4:3':
      return 4 / 3;
    case 'square':
      return 1;
    case '2:3':
      return 2 / 3;
    default:
      return undefined;
  }
};


class ImageCropper extends ImageEditorItemMixin(AppElement) {
  static get is() { return 'image-cropper'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _cropBtnDisabled: {
        type: Boolean,
        value: true
      },

      // From rotation buttons.
      _degrees: {
        type: Number,
        value: 0
      },

      // From rotation slider.
      _fineDegrees: {
        type: Number,
        value: 0
      },

      _selectedAspect: {
        type: String,
        value: 'free'
      },

      _selectedFlips: {
        type: Array,
        value: () => ([])
      },

      _selectedShape: {
        type: String,
        value: 'square'
      },

      // True when the cropper will output a png
      // when a jpeg is the input. ie. Elliptical
      // crop with transparent background.
      _transformFileType: {
        type: Boolean,
        value: false,
        computed: '__computeTransformFileType(item.type, item.ext, ext)'
      },

      _type: {
        type: String,
        value: 'cropped',
        readOnly: true
      }

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this.$.a11y.target = document.body;
  }

  // There should only be a mismatch when performing
  // an elliptical crop on a non-png image.
  // Doing so will transform the file type to png in
  // order to perserve a transparent crop area.
  // Unfortunately this can dramatically increase the
  // size of the file by ~ 5x, so limit the dimensions
  // of the output to compensate.
  __computeTransformFileType(type, ext, newExt) {
    if (!type || !ext || !newExt) { return false; }

    const originalExt = type.includes('video') ? '.jpeg' : ext;

    return originalExt !== newExt;
  }
  


  __a11yKeysPressed(event) {

    const {key} = event.detail.keyboardEvent;

    switch (key) {
      case 'ArrowDown':
        this.$.down.click();
        break;
      case 'ArrowLeft':
        this.$.left.click();
        break;
      case 'ArrowRight':
        this.$.right.click();
        break;
      case 'ArrowUp':
        this.$.up.click();
        break;
      default:
        break;
    }
  }


  __cropperActive() {
    this._cropBtnDisabled = false;
  }


  __cropperReady() {
    this.fire('image-cropper-loaded');
  }


  async __btnClicked(fn, ...args) {
    try {

      if (!this.$.cropper.isReady) { return; }

      this._cropBtnDisabled = false;

      await this.clicked(100);

      const callback = this.$.cropper[fn];

      return callback.bind(this.$.cropper)(...args);
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      return warn('Oops! That did not work right.');
    }
  }


  __zoomInClicked() {
    this.__btnClicked('zoomIn');
  }


  __zoomOutClicked() {
    this.__btnClicked('zoomOut');
  }


  __flipHorzClicked() {
    this.__btnClicked('flipHorz');
  }


  __flipVertClicked() {
    this.__btnClicked('flipVert');
  }


  __squareClicked() {
    this._selectedShape = 'square';
    this.__btnClicked('setRound', false);

    this.fire('image-cropper-round-changed', {value: false});
  }


  __circleClicked() {   
    this._selectedShape = 'circle';
    this.__btnClicked('setRound', true);

    this.fire('image-cropper-round-changed', {value: true});
  }


  __aspectRatioSelected(event) {
    if (!this.$.cropper.isReady) { return; }

    const {value: name} = event.detail;

    this._cropBtnDisabled = false;
    this._selectedAspect  = name;
    this.$.cropper.setAspectRatio(getRatio(name));
  }


  __fineDegreesChanged(event) {
    if (!this.$.cropper.isReady) { return; }

    this._cropBtnDisabled = false;
    this._fineDegrees     = event.detail.value;

    this.$.cropper.rotateTo(this._degrees + this._fineDegrees);
  }

  
  __rotateLeftClicked() {

    this._degrees -= 45;

    this.__btnClicked('rotateTo', this._degrees + this._fineDegrees);
  }


  async __centerSliderClicked() {
    try {
      await this.clicked();

      this.$.slider.center();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error); 
    }
  }

  
  __rotateRightClicked() {

    this._degrees += 45;

    this.__btnClicked('rotateTo', this._degrees + this._fineDegrees);
  }

  // Not awaiting this.clicked here
  // because __reset uses it with __btnClicked.
  __clearClicked() {
    this.__reset();
  }


  __upClicked() {
    this.__btnClicked('move', 0, -10);
  }


  __leftClicked() {
    this.__btnClicked('move', -10, 0);
  }


  __rightClicked() {
    this.__btnClicked('move', 10, 0);
  }


  __downClicked() {
    this.__btnClicked('move', 0, 10);
  }


  async __cropClicked() {
    try {      

      this.fire('image-cropper-show-spinner', {text: 'Cropping image.'});

      // Wait for spinner entry.
      await wait(300);

      const process = async () => {
        const low = await this.__btnClicked('getCrop', this.ext, this._transformFileType);

        this.$.cropper.replace(this.highQuality);

        await listenOnce(this.$.cropper, 'crop-wrapper-ready');

        const high = await this.$.cropper.getCrop(this.ext, this._transformFileType);

        // Allow new _editedSrc to replace existing img src.
        this.$.cropper.destroy();

        return {high, low};
      };

      const [detail] = await Promise.all([
        process(),
        wait(1200)
      ]);

      this.fire('image-cropper-cropped', detail);
    }
    catch (error) {
      console.error(error);
      await warn('Could not crop the image.');
    }
    finally {
      this.fire('image-cropper-hide-spinner');
    }
  }

  // Also called by image-editor-item-mixin
  // when the editedSrc is changed.
  async __reset() {  
    this._degrees        = 0;
    this._fineDegrees    = 0;
    this._selectedAspect = 'free';
    this._selectedFlips  = [];
    this._selectedShape  = 'square';

    this.$.slider.center();
    this.__btnClicked('reset');

    // Wait until after rotation-slider fires its event.
    await wait(50);

    this._cropBtnDisabled = true;
  }

}

window.customElements.define(ImageCropper.is, ImageCropper);
