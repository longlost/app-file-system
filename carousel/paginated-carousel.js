

/**
  * `paginated-carousel`
  * 
  *   Fullscreen image/photo/video viewer carousel.
  *
  *
  *
  *  Properites:
  *
  *
  *    
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
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {firebase}         from '@longlost/boot/boot.js';
import {isOnScreen}       from '@longlost/utils/utils.js';
import htmlString         from './paginated-carousel.html';
import '@longlost/app-carousel/app-carousel.js';
import './carousel-item.js';


const db = firebase.firestore();


class PaginatedCarousel extends AppElement {
  static get is() { return 'paginated-carousel'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      coll: {
        type: String,
        observer: '__collChanged'
      },

      // Passed to app-carousel.
      disabled: Boolean,

      // How many items to fetch and render at a time while paginating.
      limit: {
        type: Number,
        value: 4
      },

      // The initial photo item to center on.
      start: Object,

      // Stop subscriptions, release when not in use.
      opened: Boolean,

      // All items that include and are after the starting item.
      // These items are to the right of the starting item.
      _afterItems: {
        type: Array,
        value: () => ([])
      },

      _afterPage: {
        type: Number,
        value: 0
      },

      _afterSubscriptions: {
        type: Object,
        value: () => ({})
      },

      // The right-hand dom element used to paginate the next set of
      // db results once it appears on screen.
      _afterTrigger: Object,

      _afterTriggered: Boolean,

      // Temporary ref to correct the carousel
      // render timing for _beforeTrigger.
      // Must wait to set the trigger element after
      // the carousel has been moved back to its 
      // proper position each time elements are added
      // to the beginning of the carousels list of elements.
      _beforeEl: Object,

      // All items that are before the starting item.
      // These elements are to the left of the starting item.
      _beforeItems: {
        type: Array,
        value: () => ([])
      }, 

      _beforePage: {
        type: Number,
        value: 0
      },

      _beforeSubscriptions: {
        type: Object,
        value: () => ({})
      },

      // The left-hand dom element used to paginate the next set of
      // db results once it appears on screen.
      _beforeTrigger: Object,

      _beforeTriggered: Boolean,

      // Show carousel nav buttons on large screens 
      // that may not have touch interface.
      _nav: Boolean

    };
  }


  static get observers() {
    return [
      '__afterItemsChanged(_afterItems.*)',
      '__afterPageChanged(_afterPage)',
      '__afterTriggeredChanged(_afterTriggered)',
      '__afterTriggerElementChanged(_afterTrigger)',
      '__beforeElCarouselIndexChanged(_beforeEl, _carouselIndex)',
      '__beforeItemsChanged(_beforeItems.*)',
      '__beforePageChanged(_beforePage)',
      '__beforeTriggeredChanged(_beforeTriggered)',
      '__beforeTriggerElementChanged(_beforeTrigger)',
      '__openedStartChanged(opened, start)',
      '__openedChanged(opened)'
    ];
  }


  __collChanged(newVal, oldVal) {
    if (!newVal || (oldVal && newVal !== oldVal)) {
      this.__reset();
    }
  }


  __afterItemsChanged(obj) {
    this.__itemsChanged(obj);
  }


  __afterPageChanged(page) {

    if (!this.coll || !this.opened || !page) { return; }

    const current      = this._afterSubscriptions[page] || {};
    const subscription = {...current, page};

    this._afterSubscriptions[page] = subscription;

    this.__startSubscription(subscription, '_afterItems');
  }


  __afterTriggeredChanged(triggered) {

    if (!triggered) { return; }

    this._afterPage      = this._afterPage + 1;
    this._afterTriggered = false;
  }


  async __afterTriggerElementChanged(trigger) {
    try {

      if (!trigger) { return; }

      await isOnScreen(trigger);

      this._afterTrigger   = undefined;
      this._afterTriggered = true;
    }
    catch (error) {

      // Offscreen elements may be removed
      // during delete actions of visible items.
      // Reissue a new trigger.
      if (error === 'Element removed.') {
        const elements = this.selectAll('.after-item');

        this._afterTrigger = elements[elements.length - 1];
      }
      else {
        console.error(error);
      }
    }
  }


  __beforeItemsChanged(obj) {
    this.__itemsChanged(obj);
  }


  __beforePageChanged(page) {

    if (!this.coll || !this.opened || !page) { return; }

    const current      = this._beforeSubscriptions[page] || {};
    const subscription = {...current, page};

    this._beforeSubscriptions[page] = subscription;

    this.__startSubscription(subscription, '_beforeItems');
  }


  __beforeTriggeredChanged(triggered) {

    if (!triggered) { return; }

    this._beforePage      = this._beforePage + 1;
    this._beforeTriggered = false;
  }


  async __beforeTriggerElementChanged(trigger) {
    try {

      if (!trigger) { return; }

      await isOnScreen(trigger);

      this._beforeTrigger   = undefined;
      this._beforeTriggered = true;
    }
    catch (error) {

      // Offscreen elements may be removed
      // during delete actions of visible items.
      // Reissue a new trigger.
      if (error === 'Element removed.') {
        const elements = this.selectAll('.before-item');

        this._beforeTrigger = elements[elements.length - 1];
      }
      else {
        console.error(error);
      }
    }
  }


  async __openedStartChanged(opened, start) {

    if (!this.coll || !start) { return; }

    // Reset if parent overlay is closed.
    if (!opened) {
      this.__reset();
      return; 
    }

    const doc = await db.collection(this.coll).doc(start.uid).get();

    const page = 0;

    const afterSubscription  = {page, startAt:    doc};
    const beforeSubscription = {page, startAfter: doc};

    this._afterSubscriptions[page]  = afterSubscription;
    this._beforeSubscriptions[page] = beforeSubscription;

    this.__startSubscription(afterSubscription,  '_afterItems');
    this.__startSubscription(beforeSubscription, '_beforeItems');
  }


  __startNavMediaQuery() {

    // Larger than iPad Pro.
    this._navMediaQuery = window.matchMedia(`
      (min-width: 1025px) and (orientation: portrait),
      (min-width: 1367px) and (orientation: landscape)
    `);

    // Take immediate readings.   
    this._nav = this._navMediaQuery.matches;

    // Start listening for device changes while app is open.
    this._navMediaQueryCallback = event => {

      if (event.matches) {
        this._nav = true;
      }
      else {
        this._nav = false;
      }
    };

    this._navMediaQuery.addListener(this._navMediaQueryCallback);
  }


  __stopNavMediaQuery() {

    if (this._navMediaQuery) {
      this._navMediaQuery.removeListener(this._navMediaQueryCallback);

      this._navMediaQuery         = undefined;
      this._navMediaQueryCallback = undefined;
    }
  }


  __openedChanged(opened) {

    if (opened) {
      this.__startNavMediaQuery();
    }
    else {
      this.__stopNavMediaQuery();
    }
  }


  __updateItems(list, start, results) {
    this.splice(list, start, results.length, ...results); 
  }  


  __removeDeletedItems(list, count) {

    // Test for deleted items.
    if (count < this.limit) {

      const total = this[list].length;

      const end = total - (count - this.limit);

      // Delete operation.
      if (end < total) {

        // Remove unused dom elements from end of repeater.
        const diff = total - end;

        this.splice(list, end, diff);
      }
    }
  }


  __startSubscription(subscription, list) {

    const {page, startAfter, startAt, unsubscribe} = subscription;

    // This page not ready to be fetched yet.
    if (typeof page !== 'number') { return; }

    // Must have at least one Firestore doc.
    if (!startAfter && !startAt) { return; }

    if (unsubscribe) {
      unsubscribe();
    }


    const start = page * this.limit;


    const callback = (results, doc) => {

      this.__updateItems(list, start, results);
      this.__removeDeletedItems(list, results.length);

      if (list === '_afterItems') {

        const nextSub = this._afterSubscriptions[page + 1] || {};

        // Only start new subscriptions if the startAfter 
        // document has been changed.
        if (nextSub.startAfter && nextSub.startAfter.id === doc.id) { return; }

        const newSub = {...nextSub, startAfter: doc};

        // Add/update next page's startAfter doc ref.
        this._afterSubscriptions[page + 1] = newSub;

        this.__startSubscription(newSub, list);
      }
      else {

        const nextSub = this._beforeSubscriptions[page + 1] || {};

        // Only start new subscriptions if the startAfter 
        // document has been changed.
        if (nextSub.startAfter && nextSub.startAfter.id === doc.id) { return; }

        const newSub = {...nextSub, startAfter: doc};

        // Add/update next page's startAfter doc ref.
        this._beforeSubscriptions[page + 1] = newSub;

        this.__startSubscription(newSub, list);
      }
    };


    const errorCallback = error => {

      if (list === '_afterItems') {
        this._afterSubscriptions[page] = undefined;
        this.splice('_afterItems', start, this.limit);
      }
      else {
        this._beforeSubscriptions[page] = undefined;
        this.splice('_beforeItems', start, this.limit);
      }

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };


    const direction = list === '_afterItems' ? 'desc' : 'asc';

    let ref = db.collection(this.coll).
                where('category', 'in', ['image', 'video']).
                orderBy('timestamp', direction);

    // Only first page of '_afterItems' have a startAt doc.
    if (startAt) {
      ref = ref.startAt(startAt);
    }

    // Pagination doc.
    if (startAfter) {
      ref = ref.startAfter(startAfter);
    }


    const newUnsubscribe = ref.limit(this.limit).onSnapshot(snapshot => {

      if (snapshot.exists || ('empty' in snapshot && snapshot.empty === false)) {

        // Use the last doc to paginate next results.
        const docs = snapshot.docs;
        const doc  = docs[docs.length - 1];
        const data = [];

        snapshot.forEach(doc => data.push(doc.data()));

        callback(data, doc);
      } 
      else {
        errorCallback({message: 'document does not exist'});
      }
    }, errorCallback);


    if (list === '_afterItems') {
      this._afterSubscriptions[page].unsubscribe = newUnsubscribe;
    }
    else {
      this._beforeSubscriptions[page].unsubscribe = newUnsubscribe;
    }
  }


  __unsub() {

    const subs = {...this._afterSubscriptions, ...this._beforeSubscriptions};

    Object.values(subs).forEach(sub => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });

    this._afterSubscriptions  = {};
    this._beforeSubscriptions = {};
  }


  __reset() {
    this.__unsub();
    this._afterItems      = [];
    this._beforeItems     = [];
    this._afterPage       = 0;
    this._beforePage      = 0;
    this._afterTrigger    = undefined;
    this._beforeTrigger   = undefined;
    this._afterTriggered  = false;
    this._beforeTriggered = false;
    this._carouselIndex   = undefined;
  }


  __itemsChanged(polymerObj) {

    if (!polymerObj || !polymerObj.base) { return; }

    const {base: items} = polymerObj;

    if (!Array.isArray(items)) { return; }

    const data = items.reduce((accum, item) => {
      accum[item.uid] = item;
      return accum;
    }, {});

    this.fire('item-data-changed', {value: data});
  }


  __beforeElCarouselIndexChanged(el, carouselIndex) {
    if (!el || typeof carouselIndex !== 'number') { return; }

    this.$.carousel.moveToSection(carouselIndex + 1);

    this._beforeTrigger = el;
    this._beforeEl      = undefined;

    if (this._beforePage === 0) {
      this.fire('carousel-ready');
    }
  }


  __centeredItemChanged(event) {
    const {carouselIndex} = event.detail.value;

    if (typeof carouselIndex !== 'number') { return; }

    if (carouselIndex < this._beforeItems.length) {
      this.fire('centered-item-changed', {value: this._beforeItems[carouselIndex]});
    }
    else {

      const index = carouselIndex - this._beforeItems.length;

      this.fire('centered-item-changed', {value: this._afterItems[index]});
    }   
  }


  __carouselIndexChanged(event) {
    this._carouselIndex = event.detail.value;
  }


  __afterDomChanged() {

    if (this._afterItems.length === 0) { return; }

    const elements = this.selectAll('.after-item');

    if (elements.length !== this._afterItems.length) { return; }

    this._afterTrigger = elements[elements.length - 1]; 
  }


  async __beforeDomChanged() {

    if (this._beforeItems.length === 0) { return; }

    const elements = this.selectAll('.before-item');

    if (elements.length !== this._beforeItems.length) { return; }

    this._beforeEl = elements[elements.length - 1];
  }


  async __itemClicked(event) {
    try {
      await this.clicked();

      const {children, item} =  event.model;
      const measurements = children[1].getBoundingClientRect();

      this.fire('photo-selected', {measurements, selected: item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  } 

}

window.customElements.define(PaginatedCarousel.is, PaginatedCarousel);
