
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

import {AppElement, html}            from '@longlost/app-element/app-element.js';
import {htmlLiteral}                 from '@polymer/polymer/lib/utils/html-tag.js';
import {blobToFile}                  from '@longlost/lambda/lambda.js';
import {hijackEvent, schedule, warn} from '@longlost/utils/utils.js';
import path                          from 'path';
import mime                          from 'mime-types';

// Disable webpack config 'style-loader' so 
// these styles are not put in the document head.
import styles  from '!css-loader!cropperjs/dist/cropper.css';
import Cropper from 'cropperjs';


// Pull any src url params from end of extention.
const cleanExt = src => path.extname(src).split('?')[0];


// Returns an elliptical clipping canvas instance.
// Slightly modified to handle ovals, along with circles.
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

  // Elliptical path. Crop circles and ovals.
  const radiusX = width  / 2;
  const radiusY = height / 2;

  // Arguments: x, y, radiusX, radiusY, rotation, startAngle, endAngle.
  context.ellipse(radiusX, radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);
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


      <div id="wrapper" 
           on-contextmenu="__preventContextMenuOnCropper">

        <!-- 
          MUST set crossorigin directly here for cropperjs to 
          properly add this property to the cloned version of 
          this element!
        -->
        
        <img id="img"
             alt="[[alt]]"
             crossorigin="anonymous"
             src="[[src]]"
             on-cropstart="__active"
             on-error="__error"
             on-load="__loaded"
             on-ready="__ready"
             on-zoom="__active"/>

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

      // Used when the 'replace' method is called with
      // an image of a different size.
      _boxData: Object,

      // Used when the 'replace' method is called with
      // an image of a different size.
      _canvasData: Object,

      // Cropper.js instance.
      _cropper: Object,

      _initialCropBoxData: Object,

      _replacing: String,

      // Controls the shape of the crop area.
      _round: Boolean,

      _rotateTo: {
        type: Number,
        value: 0
      },

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

  // Prevent the menu for long clicks.
  // Long clicks and drags are common when
  // using the cropper and the context menu
  // disrupts the workflow.
  __preventContextMenuOnCropper(event) {
    hijackEvent(event);
  }


  __active() {
    this.fire('crop-wrapper-active');
  }


  __error() {
    this.destroy();
    warn('The image failed to load.');
  }


  async __loaded() {

    if (this._replacing) { 

      if (this._replacing === 'same') {
        this._replacing = undefined;
        this.isReady    = true;

        this.fire('crop-wrapper-ready');
      }

      return; 
    }

    this.destroy();

    await schedule();
    
    const preview = this.preview ? this.$.preview : '';    

    const options = {
      aspectRatio: this.initialAspectRatio,
      dragMode:   'move',
      preview,
      responsive:  true // Re-render on window 'resize'.
    };

    this._round   = this.initialRound;
    this._cropper = new Cropper(this.$.img, options);
  }

  // Cropperjs 'ready' event.
  // Call public methods AFTER this event fires.
  __ready() {

    if (!this._replacing) {
      this._initialCropBoxData = this._cropper.getCropBoxData();
    }
    else {

      // Must manually set cropper to last known settings - 
      //    placement, rotation, zoom, flip, cropBox, canvas, etc.
      //
      // Cropper rebuilds when receiving a new image when 
      // the replacement image is a different size,
      this._cropper.
        rotateTo(this._rotateTo).
        scaleX(this._xScale).
        scaleY(this._yScale);

      this._cropper.setCanvasData(this._canvasData);
      this._cropper.setCropBoxData(this._boxData);
    }

    this._replacing = undefined;
    this.isReady    = true;

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
  getCrop(extension, transformToPng) {

    // Set max width/height on cropper canvas.
    // In the case of taking an elliptical crop of a 
    // non-png image, and thus transfoming it to a png
    // the canvas will increase the file size by ~ 5x.
    // Limiting the size of the canvas size to no more than
    // 1536px is an acceptable compromize as it does not
    // increase or decrease the file size too much and is
    // still large enough for most applications.
    // When there is no file type transformation, limit
    // the canvas so it does not exceed its natural limits
    // and fail to draw the image. 
    const max = transformToPng ? 1536 : 4096;

    // Setting max sizes as per warning in cropperjs docs.
    // Should avoid getting a blank image returned.
    const options = {
      maxWidth:  max,
      maxHeight: max
    };

    // Force round crops to be png so they 
    // will have a transparent background.
    const getExt = () => {
      if (this._round) { return '.png'; }

      return extension ? extension : cleanExt(this.src);
    };

    const ext  = getExt();
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
  move(offsetX = 0, offsetY = 0) {
    this._cropper.move(offsetX, offsetY);
  }

  // Moves the canvas to a new postion given x, y coords.
  // 'y' optional.
  moveTo(x, y) {
    this._cropper.moveTo(x, y);
  }

  // Replace the image url with a new one.
  //
  // hasSameSize is optional.
  // If the new image has the same size as the old one, 
  // then it will not rebuild the cropper and only update 
  // the URLs of all related images. 
  // This can be used for applying filters.
  replace(url, hasSameSize = false) {
    this.isReady     = false;
    this._replacing  = hasSameSize ? 'same' : 'different';
    this._canvasData = this._cropper.getCanvasData();
    this._boxData    = this._cropper.getCropBoxData();

    this._cropper.replace(url, hasSameSize);
  }

  // Place image and crop area back to their initial positions.
  reset() {
    this._canvasData = undefined;
    this._boxData    = undefined;
    this._rotateTo   = 0;
    this._xScale     = 1;
    this._yScale     = 1;
    this._round      = this.initialRound;

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
    this._rotateTo = degree;
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
  zoom(ratio = 0) {
    this._cropper.zoom(ratio);
  }


  zoomIn() {
    this.zoom(0.1);
  }


  zoomOut() {
    this.zoom(-0.1);
  }

}

window.customElements.define(CropWrapper.is, CropWrapper);
