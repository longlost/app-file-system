

/**
  * `image-filters`
  * 
  *   
  *   Alter the appearance of an imput image with common adjustments and filters.
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
import {schedule, wait, warn} from '@longlost/utils/utils.js';
import {imgFilterFile}        from '../shared/utils.js';
import htmlString             from './image-filters.html';
import '@polymer/iron-selector/iron-selector.js';
import './image-editor-item.js';
import './filter-item.js';


const createFilter = (filter, source) => name => {
  filter.addFilter(name);

  const canvas = filter.apply(source);

  filter.reset();

  return canvas.toDataURL();
};


class ImageFilters extends FilterMixin(ImageEditorItemMixin(AppElement)) {
  static get is() { return 'image-filters'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      _filters: {
        type: Array,
        computed: '__computeFilters(_filter, _loaded, _sourceImg)'
      },

      _loaded: Boolean,

      // Hidden javascript Image element reference.
      // Not using the <img> that's in the light dom
      // in order to get the correct dimensions (natural sizes)
      // set for the filter's underlying canvas, so as
      // not to distort the image's aspect ratio.
      _sourceImg: Object,

      _previewSrc: {
        type: String,
        computed: '__computePreviewSrc(_filter, _src)'
      },

      _thumbnail: {
        type: String,
        computed: '__computeThumbnail(item)'
      },

      // Used in _name computed method.
      _type: {
        type: String,
        value: 'filtered',
        readOnly: true
      },

    };
  }


  static get observers() {
    return [
      '__previewSrcChanged(_previewSrc)'
    ];
  }


  __computeFilters(filter, loaded, source) {
    if (!filter || !loaded || !source) { return; }

    const creator = createFilter(filter, source);

    return [
      {src: creator('brownie'),             name: 'brownie',             label: 'Brownie'},
      {src: creator('kodachrome'),          name: 'kodachrome',          label: 'Kodachrome'},
      {src: creator('polaroid'),            name: 'polaroid',            label: 'Polaroid'},
      {src: creator('sepia'),               name: 'sepia',               label: 'Sepia'},
      {src: creator('technicolor'),         name: 'technicolor',         label: 'Technicolor'},
      {src: creator('vintagePinhole'),      name: 'vintagePinhole',      label: 'Vintage'},
      {src: creator('desaturateLuminance'), name: 'desaturateLuminance', label: 'Desaturate'},
      {src: creator('desaturate'),          name: 'desaturate',          label: 'Greyscale'}
    ];
  }


  __computePreviewSrc(filter, src) {
    if (filter && src) { return src; }

    return '#';
  }


  __computeThumbnail(item) {
    if (!item) { return '#'; }

    const {optimized, thumbnail} = item;

    if (thumbnail) {
      return thumbnail;
    }

    return optimized || '#';
  }

  // Wait for '_previewSrc' timing but use the 
  // smaller thumbnail file for the 'filter-item's.
  __previewSrcChanged(src) {
    this._loaded = false;

    if (!src || src === '#') {
      this._sourceImg = undefined;
    }

    const img = new Image();

    img.onload = () => {
      this._sourceImg = img;
    };

    // Must set crossOrigin to allow WebGl to load the image.
    img.crossOrigin = 'anonymous';

    // Start with the thumbnail for best performance,
    // but MUST use the newly edited version so edits
    // are reflected in the choices.
    img.src = this._newSrc || this._thumbnail;
  }


  async __previewLoaded() {

    await schedule(); // Safari fix for WebGL: INVALID_VALUE: texImage2D: bad image data.

    this._loaded = true;

    this.fire('image-filters-loaded');
  }


  __filterSelected(event) {
    this._selectedFilter = event.detail.value;
  }


  __domChanged() {
    this.fire('image-filters-stamped');
  }

  // Called by image-editor-item-mixin
  // when the editedSrc is changed.
  __reset() {
    if (this._filter) {
      this._loaded = false;
    }
  }


  async __applyClicked() {
    try {

      this.fire('image-filters-show-spinner', {text: 'Applying filter.'});

      // Wait for spinner entry.
      await wait(300);

      this._filter.reset();
      this._filter.addFilter(this._selectedFilter);

      const process = async () => {
        const low  = await imgFilterFile(this._filter, this._src,        this._name, this.ext);
        const high = await imgFilterFile(this._filter, this.highQuality, this._name, this.ext);

        return {high, low};
      };
    
      const [detail] = await Promise.all([
        process(),
        wait(1200)
      ]);

      this.fire('image-filters-filter-applied', detail);
    }
    catch (error) {
      console.error(error);
      await warn('Could not apply the filter.');
    }
    finally {
      this.fire('image-filters-hide-spinner');
    }
  }

}

window.customElements.define(ImageFilters.is, ImageFilters);
