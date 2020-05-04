
/**
  * `crop-wrapper`
  * 
  *   A wrapper element for cropperjs library.
  *
  *   https://github.com/fengyuanchen/cropperjs
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/

import {AppElement, html} from '@longlost/app-element/app-element.js';
import {htmlLiteral}      from '@polymer/polymer/lib/utils/html-tag.js';
import {blobToFile}       from '@longlost/lambda/lambda.js';
import {warn}             from '@longlost/utils/utils.js';
import path               from 'path';
import mime               from 'mime-types';
// Disable webpack config 'style-loader' so 
// these styles are not put in the document head.
import styles  from '!css-loader!cropperjs/dist/cropper.css';
import Cropper from 'cropperjs';


// Pull any src url params from end of extention.
const cleanExt = src => path.extname(src).split('?')[0];


// Returns a round clipping canvas instance.
// Pulled from the source code from:
//    https://fengyuanchen.github.io/cropper.js/examples/crop-a-round-image.html
const getRoundedCanvas = sourceCanvas => {
  const canvas  = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const width   = sourceCanvas.width;
  const height  = sourceCanvas.height;

  canvas.width  = width;
  canvas.height = height;

  context.imageSmoothingEnabled = true;

  context.drawImage(sourceCanvas, 0, 0, width, height);
  context.globalCompositeOperation = 'destination-in';
  context.beginPath();

  context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);  
  context.fill();

  return canvas;
};


class CropWrapper extends AppElement {
  static get is() { return 'crop-wrapper'; }

  static get template() {

    return html`
      <style>
      
        :host {
          display:          block;
          background-color: inherit;

          --preview-mixin: {
            height:     100px;
            margin-top: 16px;
          };

          --crop-area-border-radius: 0px;
          --crop-color: var(--app-primary-color);
        }

        #wrapper {
          height: 100%;
        }

        #img {
          display:   block;
          max-width: 100%;
        }        

        #preview {
          @apply --preview-mixin;
          overflow: hidden;
        }

        #preview[hidden] {
          display: none;
        }


        ${this.stylePartial}


        .cropper-view-box,
        .cropper-face {
          border-radius: var(--crop-area-border-radius);
        }

        .cropper-view-box {
          outline: 1px solid var(--crop-color);
        }

        .cropper-line,
        .cropper-point,
        .cropper-point.point-se::before {
          background-color: var(--crop-color);
        }

      </style>


      <div id="wrapper">
        <img id="img"
             alt="[[alt]]"
             src="[[src]]" 
             on-error="__error"
             on-load="__loaded"
             on-ready="__ready"/>
      </div>


      <div id="preview" 
           hidden="[[!preview]]">
      </div>
      
    `;
  }


  static get stylePartial() {
    return htmlLiteral([styles.toString()]);
  }


  static get properties() {
    return {

      alt: {
        type: String,
        value: 'Image to crop.'
      },

      // By default the crop area aspect ratio is free
      initialAspectRatio: Number,

      // Initial shape of the crop area is round when true.
      initialRound: Boolean,

      // Read-only property. 
      // True when cropper has initialized and
      // can have its methods called.
      // CANNOT name this 'ready' because that is the 
      // name of a method inherited by Polymer element. 
      isReady: Boolean,

      // The new cropped output file's name.
      name: {
        type: String,
        value: 'cropped'
      },

      // Create a live preview element, when true.
      // Use the --preivew-mixin to style it.
      preview: {
        type: Boolean,
        value: false
      },

      // Source string for image to be cropped.
      src: String,

      // Cropper.js instance.
      _cropper: Object,

      _initialCropBoxData: Object,

      // Controls the shape of the crop area.
      _round: Boolean,

      _xScale: {
        type: Number,
        value: 1
      },

      _yScale: {
        type: Number,
        value: 1
      }

    };
  }


  static get observers() {
    return [
      '__roundChanged(_round)'
    ];
  }


  __roundChanged(round) {

    if (round) {
      this.updateStyles({'--crop-area-border-radius': '50%'});
    }
    else {
      this.updateStyles({'--crop-area-border-radius': '0px'});
    }
  }


  __error() {
    this.destroy();
    warn('The image failed to load.');
  }


  __loaded() {

    this.destroy();
    
    const preview = this.preview ? this.$.preview : '';    

    const options = {
      aspectRatio: this.initialAspectRatio,
      dragMode:   'move',
      preview    
    };

    this._round   = this.initialRound;
    this._cropper = new Cropper(this.$.img, options);
  }

  // Cropperjs 'ready' event.
  // Call public methods AFTER this event fires.
  __ready() {

    this._initialCropBoxData = this._cropper.getCropBoxData();

    this.isReady = true;
    this.fire('crop-wrapper-ready');
  }


  destroy() {

    if (this._cropper) {
      this._cropper.destroy();
      this._cropper = undefined;
      this.isReady  = false;
    }
  }

  // Flip the image horizontally.
  flipHorz() {

    this._xScale = this._xScale * -1;

    this._cropper.scaleX(this._xScale);
  }

  // Flip the image vertically.
  flipVert() {

    this._yScale = this._yScale * -1;

    this._cropper.scaleY(this._yScale);
  }

  // Returns a promise which resolves 
  // to the generated crop file.
  getCrop() {

    // Setting max sizes as per warning in cropperjs docs.
    // Should avoid getting a blank image returned.
    const options = {
      maxWidth:  4096,
      maxHeight: 4096
    };

    // Force round crops to be png so they 
    // will have a transparent background.
    // 
    const ext  = this._round ? '.png' : cleanExt(this.src);
    const name = `${this.name}${ext}`;
    const type = this._round ? 'image/png' : mime.contentType(name);

    const canvas = this._cropper.getCroppedCanvas(options);
    const c = this._round ? getRoundedCanvas(canvas) : canvas;

    const promise = new Promise(resolve => {

      c.toBlob(
        blob => {
          resolve(blobToFile(blob, name, type));
        }, 
        type
      );
    });

    return promise;
  }

  // Moves the canvas by relative offsets.
  // 'offsetY' optional.
  move(offsetX, offsetY) {
    this._cropper.move(offsetX, offsetY);
  }

  // Moves the canvas to a new postion given x, y coords.
  // 'y' optional.
  moveTo(x, y) {
    this._cropper.moveTo(x, y);
  }

  // Place image and crop area back to their initial positions.
  reset() {
    this._round = this.initialRound;
    this._cropper.setCropBoxData(this._initialCropBoxData);
    this._cropper.reset();

    // Resetting aspect ratio MUST come after reset.    
    this.setAspectRatio(this.initialAspectRatio);
  }

  // Rotate the image with a relative degree.
  rotate(degree) {
    this._cropper.rotate(degree);
  }

  // Rotate the image to an absolute degree.
  rotateTo(degree) {
    this._cropper.rotateTo(degree);
  }

  // Change the aspect ratio of the crop area.
  // Since NaN is so toxic and considered a
  // terribly bad practice, the consumer should
  // call this method without arguments or pass
  // undefined to set the aspect as free.
  setAspectRatio(aspect = NaN) {
    this._cropper.setAspectRatio(aspect);
  }

  // Set crop area shape to be round or rectangular.
  setRound(bool) {
    this._round = bool;
  }

  // Zooms the canvas with a relative ratio.
  // ie. ratio === -0.1
  zoom(ratio) {
    this._cropper.zoom(ratio);
  }

}

window.customElements.define(CropWrapper.is, CropWrapper);
