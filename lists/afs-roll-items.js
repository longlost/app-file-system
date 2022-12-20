

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

    this.reverseConstraints = [
      where('category', 'in', ['image', 'video']),
      orderBy('timestamp', 'asc')
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

  // Add items to the detail payload then forward the event.
  __openCarouselHandler(event) {

    hijackEvent(event);

    const {index: tempIndex, item} = event.detail;
    const uid                      = item?.uid;

    if (!uid) { return; } // Erroneous item.

    // Remember, '_repeaterItems' is a subset of '_listItems', so 
    // find the proper index, which is relative to '_listItems.
    //
    // Find the index of the item from the master list.
    const index = this._listItems.findIndex(item => item.data.uid === uid);

    if (typeof index !== 'number') { return; } // Index not found.

    this.fire('open-carousel', {
      ...event.detail, 

      // The selected index relation to '_listItems'.
      // Overwrite the detail's 'index'.
      index, 

      // The renamed selected item's index, in realation to '_repeaterItems'.
      tempIndex,

      // Only send the subset of 'live', currently displayed items.
      tempItems: this._repeaterItems
    });
  }

}

window.customElements.define(AFSRollItems.is, AFSRollItems);
