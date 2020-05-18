

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
import {warn}                 from '@longlost/utils/utils.js';
import {highQualityFile}      from '../shared/utils.js';
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
        computed: '__computeFilters(_filter, _loaded, _preview)'
      },

      _loaded: Boolean,

      _page: {
        type: String,
        value: 'filters',
        readOnly: true
      },

      // Preview img element reference.
      _preview: Object,

      _previewSrc: {
        type: String,
        computed: '__computePreviewSrc(_filter, _src)'
      },

      // Used in _name computed method.
      _type: {
        type: String,
        value: 'filtered',
        readOnly: true
      },

    };
  }


  connectedCallback() {
    super.connectedCallback();

    this._preview = this.$.preview;
  }


  __computeFilters(filter, loaded, preview) {
    if (!filter || !loaded || !preview) { return; }

    const creator = createFilter(filter, preview);

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


  __loaded() {
    if (this._src && this._src !== '#') {
      this._loaded = true;
    }
  }


  __filterSelected(event) {
    this._selectedFilter = event.detail.value;
  }


  __reset() {
    if (this._filter) {
      this._filter         = undefined;
      this._loaded         = false;
      this._selectedFilter = undefined;
    }
  }


  async __applyClicked() {
    try {

      this._filter.reset();
      this._filter.addFilter(this._selectedFilter);
    
      const file =  await highQualityFile(
        this._filter, 
        this._highQuality, 
        this._name
      );

      this.fire('image-filters-applied', {value: file});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      await warn('Could not apply the filter.');
    }
    finally {
      this.$.item.hideSpinner();
    }
  }

}

window.customElements.define(ImageFilters.is, ImageFilters);
