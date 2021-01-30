

/**
  * `afs-paginated-carousel`
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


import {AppElement, html} from '@longlost/app-core/app-element.js';
import * as database      from '@longlost/app-core/services/db.js';
import {isOnScreen}       from '@longlost/app-core/utils.js';
import htmlString         from './afs-paginated-carousel.html';
import '@longlost/app-carousels/app-carousel.js';
import './afs-carousel-item.js';


class AFSPaginatedCarousel extends AppElement {
  
  static get is() { return 'afs-paginated-carousel'; }

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

      // Workaround for Safari carousel slotted elements with scroll-snap.
      _afterNodes: Array,

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

      // Workaround for Safari carousel slotted elements with scroll-snap.
      _beforeNodes: Array,

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

      // Used to wait until the carousel settles on an item before
      // lazy loading new items into the '_beforeItems' array.
      _centered: Boolean,

      // Carousel item is 100vw + 4px margin on either side.
      // The 6px adjustment enlarges the screen IntersectonObserver 
      // rootMargin bbox 2px greater so the promise is resolved 
      // just before the trigger element comes into view.
      _isOnScreenAdjustment: {
        type: Number,
        value: 6
      },

      // Used to keep track of before item lazy loading scroll corrections.
      // This ensures that only one correction is made per page.
      _lastShiftedPage: Number,

      // Show carousel nav buttons on large screens 
      // that may not have touch interface.
      _nav: Boolean,

      // Used to fire 'carousel-ready' events once 
      // the carousel is ready to be shown.
      _ready: Boolean

    };
  }


  static get observers() {
    return [
      '__afterItemsChanged(_afterItems.*)',
      '__afterPageChanged(_afterPage)',
      '__afterTriggeredChanged(_afterTriggered)',
      '__afterTriggerElementChanged(_afterTrigger)',
      '__beforeElCenteredChanged(_beforeEl, _centered)',
      '__beforeItemsChanged(_beforeItems.*)',
      '__beforePageChanged(_beforePage)',
      '__beforeTriggeredChanged(_beforeTriggered)',
      '__beforeTriggerElementChanged(_beforeTrigger)',
      '__disabledItemsChanged(disabled, _afterItems.*, _beforeItems.*)',
      '__openedStartChanged(opened, start)',
      '__openedChanged(opened)',

      // Safari workaround for slotted carousel nodes with scroll-snap.
      '__nodesChanged(_afterNodes, _beforeNodes)',
      '__readyChanged(_ready)'
    ];
  }


  connectedCallback() {

    super.connectedCallback();

    this.$.carousel.scrollContainer = this.$.scroller;
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


  async __afterTriggerElementChanged(el) {

    try {

      if (!el) { return; }

      // Carousel item is 100vw + 4px margin on either side.
      // The 6px adjustment enlarges the screen IntersectonObserver 
      // rootMargin bbox 2px greater so the promise is resolved 
      // just before the trigger element comes into view.
      await isOnScreen(el,  this._isOnScreenAdjustment);

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


  async __beforeTriggerElementChanged(el) {

    try {

      if (!el) { return; }

      // Carousel item is 100vw + 4px margin on either side.
      // The 6px adjustment enlarges the screen IntersectonObserver 
      // rootMargin bbox 2px greater so the promise is resolved 
      // just before the trigger element comes into view.
      await isOnScreen(el, this._isOnScreenAdjustment);

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

  // Check for last item deleted.
  __disabledItemsChanged(disabled, afterPolymerObj, beforePolymerObj) {

    if (disabled || !afterPolymerObj || !beforePolymerObj) { return; }

    const {base: afterItems}  = afterPolymerObj;
    const {base: beforeItems} = beforePolymerObj;

    if (afterItems.length === 0 && beforeItems.length === 0) {
      this.fire('last-item-deleted');
    }
  }


  async __openedStartChanged(opened, start) {

    if (!this.coll) { return; }

    // Reset if parent overlay is closed.
    if (!opened) {
      this.__reset();
      return; 
    }

    if (!start) { return; }

    const db  = await database.init();
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

  // All initial data, dom nodes and shifting done.
  // Ready to render the carousel.
  __readyChanged(ready) {

    if (ready) {
      this.fire('carousel-ready');
    }
  }


  __updateItems(list, start, results) {

    this.splice(list, start, results.length, ...results); 
  }


  __removeDeletedItems(list, start, count) {

    // Test for deleted items.
    if (count < this.limit) {

      const total = this[list].length;
      const end   = start + count;

      // Delete operation.
      if (end < total) {

        // Remove unused dom elements from end of repeater.
        const diff = total - end;

        this.splice(list, end, diff);
      }
    }
  }


  async __startSubscription(subscription, list) {

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

      window.requestAnimationFrame(() => {        

        this.__updateItems(list, start, results);
        this.__removeDeletedItems(list, start, results.length);

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
      });
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


    const db = await database.init();

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
    this._afterNodes      = undefined;
    this._beforeNodes     = undefined;
    this._afterTrigger    = undefined;
    this._beforeTrigger   = undefined;
    this._afterTriggered  = false;
    this._beforeTriggered = false;
    this._beforeEl        = undefined;
    this._centered        = false;
    this._lastShiftedPage = undefined;
    this._ready           = false;
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

  // Reset the scroller back to the current item, as it
  // will have shifted to the beginning once new dom
  // elements have been appended to the front.
  __resetScrollerPosition(el, left) {

    // Chrome and FireFox will respect the first attempt to reset
    // the scroller's position, but Safari is very stubborn.
    // The number of attempts to reset its position varies greatly,
    // so take dynamic measurements and keep trying until it works.
    const correctScrollPosition = (tries, doubleChecked) => {

      // MUST be rAF and NOT `schedule` for Safari!
      window.requestAnimationFrame(() => {

        // Bail if the overlay has been closed.
        if (!this.opened) { return; } 

        // Give up trying if this consumes too much time and is not
        // working effectively. Safari is unpredictable.
        if (this.$.scroller.scrollLeft === left || tries === 10) {

          if (doubleChecked) {
            this._beforeTrigger = el;
            this._beforeEl      = undefined;
            this._centered      = false;

            if (this._beforePage === 0) {
              this._ready = true;
            }
          }
          else {

            // The scroller is where it should be.
            // Double check that it is, measure it one more time.
            correctScrollPosition(tries, true);
          }
        }
        else {

          // Attempt to move the scroller back to the correct position again.
          this.$.scroller.scroll(left, 0);

          // Increment 'tries' and measure again.
          correctScrollPosition(tries + 1, false);
        }        
      });     
    };

    // This first try works on Chrome and Firefox, but not Safari.
    this.$.scroller.scroll(left, 0);

    correctScrollPosition(1, false);
  }

  // Reposition to current photo when new items are added.
  // New before items shift the scrolled elements to the right,
  // since the dom is ltr based, so this method compensates for 
  // that distance and places the current photo back into view. 
  async __beforeElCenteredChanged(el, centered) {

    if (!el || !centered) { return; }

    if (!this.opened) { return; }

    // Only correct for each lazy loaded page of before items once.
    if (this._lastShiftedPage >= this._beforePage) { return; }

    this._lastShiftedPage = this._beforePage;

    // Calculate how many new elements/sections are being added
    // to determine how much to shift the scroller back so
    // the current item is still placed in view.
    const remainder = this._beforeNodes.length % this.limit;
    const sections  = remainder === 0 ? this.limit : remainder;
    const {width}   = el.getBoundingClientRect();

    // Watching one item from the end as 
    // lazy loading trigger after initial setup.
    // See '__beforeDomChanged' method.
    const left = this._beforePage === 0 ? 
                   width * sections : 
                   width * (sections + 1);

    this.__resetScrollerPosition(el, left);
  }


  __carouselCenteredChanged(event) {

    const {carouselIndex} = event.detail.value;

    if (typeof carouselIndex !== 'number') { return; }

    if (carouselIndex < this._beforeItems.length) {

      // Undo the nav correction that happens in '__nodesChanged' method.
      const reversed = [...this._beforeItems].reverse();

      this.fire('centered-item-changed', {value: reversed[carouselIndex]});
    }
    else {

      const index = carouselIndex - this._beforeItems.length;

      this.fire('centered-item-changed', {value: this._afterItems[index]});
    }

    // Wait for carousel to be settled for a few 
    // frames before lazy loading more items.
    this._centered = true;

    // No before elements to add to dom, 
    // so no shifting to wait for.
    if (this._beforeItems.length === 0) {
      this._ready = true;
    }
  }


  __afterDomChanged() {

    if (this._afterItems.length === 0) { return; }

    const elements = this.selectAll('.after-item');

    if (elements.length !== this._afterItems.length) { return; }

    // Safari carousel workaround.
    this._afterNodes = elements;

    this._afterTrigger = elements.length > 1 ? elements[elements.length - 1] : elements[0]; 
  }
  

  __beforeDomChanged() {

    if (this._beforeItems.length === 0) { return; }

    const elements = this.selectAll('.before-item');

    if (elements.length !== this._beforeItems.length) { return; }

    // Safari carousel workaround.
    this._beforeNodes = elements;

    // Carousel must get shifted each time new before elements are added.
    this._beforeEl = elements.length > 1 ? elements[elements.length - 1] : elements[0];
  }

  // Safari workaround for slotted 
  // carousel nodes with scroll-snap.
  __nodesChanged(after = [], before = []) {

    // Feed before items in reverse order so nav works correctly.
    const reversed = [...before].reverse();

    this.$.carousel.setElements([...reversed, ...after]);
  }

}

window.customElements.define(AFSPaginatedCarousel.is, AFSPaginatedCarousel);
