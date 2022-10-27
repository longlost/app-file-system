

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


import {AppElement} from '@longlost/app-core/app-element.js';

import {
  clamp, 
  scale
} from '@longlost/app-core/lambda.js';

import {
  hijackEvent, 
  listenOnce
} from '@longlost/app-core/utils.js';

import {
  collection,
  endAt,
  initDb,
  limit,
  onSnapshot,
  orderBy,
  queryColl,
  startAt,
  where
} from '@longlost/app-core/services/services.js';

import {ItemsMixin} from './items-mixin.js';
import template     from './afs-roll-items.html';
import '@longlost/app-lists/lite-list.js';
import './afs-roll-item.js';


// args -> inputMin, inputMax, outputMin, outputMax, input.
const thumbnailScaler = scale(0, 100, 72, 148);


class AFSRollItems extends ItemsMixin(AppElement) {

  static get is() { return 'afs-roll-items'; }

  static get template() { return template; }


  static get properties() {
    return {

      // From 0 to 100.
      scale: Number,

      // Whether currently fetching from the db or not.
      // Used to limit only one sub at at time to the db.
      _busy: Boolean,

      _currentItems: Array,

      _data: {
        type: Object,
        computed: '__computeData(_items.*)'
      },

      // Firestore reference.
      _db: Object,

      // Since the list is built dynamically, there is no 
      // way to know the total number of entries in the db
      // ahead of time. 
      //
      // Therefore, assume the end has been reached anytime
      // the number of returned entries decreases relative 
      // to the prior batch.
      _endDetected: Boolean,

      _index: {
        type: Number,
        computed: '__computeIndex(_lag, _pagination.start)'
      },

      _items: Array, // Initializing as undefined is required.

      // Trail the current topmost row of visible items with the
      // set of live entries, to create a buffer in preparation 
      // for a sudden change in scroll direction.
      //
      // Roughly 1/2 viewport height worth of items to lag by.
      _lag: {
        type: Number,
        computed: '__computeLag(_pagination.direction, _visibleCount)'
      },

      // From 'lite-list'.
      //
      // Maximum number of entries to fetch per pagination.
      _max: Number,    

      // How many items to fetch for initialization.
      _min: {
        type: Number,
        value: 8
      },

      // From 'lite-list' 'pagination-changed' event.
      _pagination: Object,

      // The latest cached pagination while the db was busy.
      _paginationWaiting: Object,

      // Firebase db ref based on coll
      _ref: {
        type: Object,
        computed: '__computeRef(coll, _db)'
      },

      _resolution: {
        type: Number,
        value: 1,
        computed: '__computeResolution(_max)'
      },

      _resultsCount: {
        type: Number,
        observer: '__resultsCountChanged'
      },

      // Services/Firestore subscription unsubscribe function.
      _unsubscribe: Object,

      _visibleCount: {
        type: Number,
        computed: '__computeVisibleCount(_pagination)'
      }

    };
  }


  static get observers() {
    return [
      '__dataChanged(_data)',
      '__scaleChanged(scale)',
      '__updateItems(opened, _ref, _index)'
    ];
  }


  async connectedCallback() {

    super.connectedCallback();

    this._db = await initDb();
  }


  disconnectedCallback() {

    super.disconnectedCallback();

    this.__unsub();
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


  __computeIndex(lag, start) {

    if (typeof lag !== 'number' || typeof start !== 'number') { return; }

    return Math.max(0, start + lag);
  }

  
  __computeLag(direction = 'forward', count = 0) {

    const scalar = Math.ceil(count / 2);

    // Lag opposes current scroll direction.
    //
    // Lag in 'reverse' includes an offset 
    // of visible items count.
    return direction === 'forward' ? scalar * -1 : scalar + count;
  }


  __computeRef(coll, db) {

    if (!coll || !db) { return; }

    // Will need to create an index in Firestore.
    return collection(db, coll);
  }

  // Represents the number of times the current db subscription
  // is shifted as the user scrolls, relative to the maximum
  // number of DOM elements.
  __computeResolution(max = 0) {

    return Math.ceil(max / 4);    
  }


  __computeVisibleCount(pagination) {

    if (!pagination) { return 1; }

    const {itemBbox, parentBbox, per} = pagination;

    const visibleRows = Math.ceil(parentBbox.height / itemBbox.height);

    return visibleRows * per;
  }


  __dataChanged(data) {

    if (!data) { return; }

    this.fire('item-data-changed', {value: data});
  }


  __resultsCountChanged(newCount, oldCount) {

    if (newCount < oldCount && this._pagination?.direction === 'forward') {

      this._endDetected = true;
    }
    else {

      this._endDetected = false;
    }
  }


  __scaleChanged(scale) {
    
    if (typeof scale !== 'number') { return; }

    const size = thumbnailScaler(scale);

    this.updateStyles({'--thumbnail-size': `${size}px`});
  }

  // Attempt to free up memory of very large lists.
  //
  // Set unneeded photo db objects to undefined to 
  // release their references and promote true GC.
  //
  // Deemed ready for manual GC when items are very 
  // far off screen, relative to the viewport.
  //
  // The max amount of data items left in the array is
  // this._max * 3. That is, the current set of items
  // that are being subscribed to (1 max total), and 
  // one set of stale items before (1 max), and one 
  // set after (1 max), the current visible/live set.
  __garbageCollect(index, direction) {

    if (!this._pagination || this._max <= this._min) { return; }

    const garbageIndex = direction === 'forward' ?
                           index - this._max :
                           index + this._max;

    const totalGarbage = direction === 'forward' ? 
                           garbageIndex : 
                           this._items.length - garbageIndex;

    // Only GC between 0 and this._max items at a time.
    const count = clamp(0, this._max, totalGarbage);
    const clear = Array(count).fill(undefined);

    // Do not force and update with 'this.splice()', as these
    // changes do NOT need to be reflected the DOM.
    this._items.splice(garbageIndex, clear.length, ...clear);
  }


  __getQueryConstraints(index, direction) {

    const constraints = [
      where('category', 'in', ['image', 'video']),
      orderBy('timestamp', 'desc')
    ];
    
    if (index > 0) {

      const {doc} = this._items.at(index);

      if (direction === 'reverse') {
        constraints.push(endAt(doc));
      }
      else {
        constraints.push(startAt(doc));
      }
    }

    constraints.push(limit(Math.max(this._min, this._max)));

    return constraints;
  }


  // Start a subscription to file data changes.
  __updateItems(opened, ref, index) {

    if (
      !ref ||
      (index > 0 && !this._items.at(index)) // Validate index is in range.
    ) { return; } 
    
    // Cancel previous subscription.
    this.__unsub();

    // Don't start a new subscription if parent overlay is closed.
    if (!opened) { return; }

    this._busy = true;

    // Cache this value to guarantee it's accurate for 
    // this particular set of results.
    const direction = this._pagination?.direction;

    this.__garbageCollect(index, direction);


    const callback = results => {

      // Check for any late returning results that are from prior subs.
      if (this._busy && index !== this._index) { return; }

      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      const validResults = results.filter(obj => obj.data.uid);
      this._resultsCount = validResults.length; // Used to detect the end of db entries.

      // Add/replace current range of results into the main '_items' array.
      if (Array.isArray(this._items)) {

        // Reverse pagination uses 'endAt' db function to fetch
        // items that come before the current index.
        if (direction === 'reverse') {

          const start = index - (validResults.length - 1);

          this.splice('_items', start, validResults.length, ...validResults);
        }
        else {
        
          this.splice('_items', index, validResults.length, ...validResults);
        }
      }
      else { // Initialization.

        this.set('_items', validResults);
      }

      this._busy = false;

      if (this._paginationWaiting) {

        this._pagination        = this._paginationWaiting;
        this._paginationWaiting = undefined;
      }
    };

    const errorCallback = error => {

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }
      
      this._items = undefined;

      console.error(error);
    };


    const constraints = this.__getQueryConstraints(index, direction);
    const q           = queryColl(ref, ...constraints);

    this._unsubscribe = onSnapshot(q, snapshot => {

      if (snapshot.exists || ('empty' in snapshot && snapshot.empty === false)) {

        window.requestAnimationFrame(() => {

          // Use the last doc to paginate next results.
          const docs    = snapshot.docs;
          const doc     = docs[docs.length - 1];
          const results = [];

          // Snapshots are not true arrays. So make one.
          snapshot.forEach(doc => results.push({data: doc.data(), doc}));

          callback(results);
        });
      } 
      else {
        errorCallback({message: 'document does not exist'});
      }
    }, errorCallback);
  }


  __unsub() {

    if (this._unsubscribe) {

      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }

  // Output from 'lite-list', used to sync
  // the local repeater of slotted items.
  __currentItemsChangedHandler(event) {

    hijackEvent(event);

    this._currentItems = event.detail.value;
  }


  __maxContainersChangedHandler(event) {

    // NOTE! Cannot hijack this event, it's also 
    // used by '__paginationChangedHandler'.

    this._max = event.detail.value;
  }


  async __paginationChangedHandler(event) {

    hijackEvent(event);

    const pagination                = event.detail.value;
    const {count, direction, start} = pagination;

    // Ignore 'lite-list' initialization.
    if (count < this._items.length && start === 0) { return; } 

    // At the end of the camera roll. Done paginating.
    if (this._endDetected && start >= this._pagination.start) { return; }

    // Do not hit the db at each change.
    //
    // The resolution of this event is 1 fired for each row
    // of photos that passes the top of the viewport.
    const remainder = start % this._resolution;

    // Skip this tick.
    if (remainder !== 0) { return; }

    // Must wait for the next update to 'max' before
    // triggering a new db subscription.
    if (count <= this._min) {
      
      await listenOnce(this, 'lite-list-max-containers-changed');
    }

    if (this._busy) {

      this._paginationWaiting = pagination;
    }
    else {

      this._pagination = pagination;
    }
  }


  __domChangeHandler(event) {

    hijackEvent(event);

    // Inform 'list-overlay-mixin' of change.
    this.fire('app-file-system-list-items-dom-changed');
  }

}

window.customElements.define(AFSRollItems.is, AFSRollItems);
