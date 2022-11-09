

/**
  * `afs-roll-items`
  * 
  *   Photo items list.
  *
  *
  *
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement}     from '@longlost/app-core/app-element.js';
import {scale}          from '@longlost/app-core/lambda.js';
import {hijackEvent}    from '@longlost/app-core/utils.js';
import {orderBy, where} from '@longlost/app-core/services/services.js';
import {DbListMixin}    from '@longlost/app-lists/db-list-mixin.js';
import template         from './afs-roll-items.html';
import './afs-roll-item.js';


// args -> inputMin, inputMax, outputMin, outputMax, input.
const thumbnailScaler = scale(0, 100, 72, 148);


class AFSRollItems extends DbListMixin(AppElement) {

  static get is() { return 'afs-roll-items'; }

  static get template() { return template; }


  static get properties() {
    return {

      // From tri-state multiselect-btns.
      // Select all item checkboxes when true.
      all: Boolean,

      // Set to true to hide <file-item> <select-checkbox>'s
      hideCheckboxes: Boolean,

      // From 0 to 100.
      scale: Number,

      // File upload controls, progress and state.
      uploads: Object,

      _data: {
        type: Object,
        computed: '__computeData(_listItems.*)' // '_listItems' from DbListMixin.
      }

    };
  }


  static get observers() {
    return [
      '__dataChanged(_data)',
      '__scaleChanged(scale)'
    ];
  }


  constructor() {

    super();

    // DbListMixin.
    this.constraints = [
      where('category', 'in', ['image', 'video']),
      orderBy('timestamp', 'desc')
    ];
  }


  __computeData(polymerObj) {

    const items = polymerObj?.base;

    if (!Array.isArray(items)) { return; }

    return items.reduce((accum, item) => {

      if (!item) { return accum; } // Items may be GC'd.

      accum[item.data.uid] = item.data;

      return accum;
    }, {});
  }


  __dataChanged(data) {

    if (!data) { return; }

    this.fire('item-data-changed', {value: data});
  }


  __scaleChanged(scale) {
    
    if (typeof scale !== 'number') { return; }

    const size = thumbnailScaler(scale);

    this.updateStyles({'--thumbnail-size': `${size}px`});
  }


  __domChangeHandler(event) {

    hijackEvent(event);

    // Inform 'list-overlay-mixin' of change.
    this.fire('app-file-system-list-items-dom-changed');
  }

}

window.customElements.define(AFSRollItems.is, AFSRollItems);
