

/**
  * `afs-file-items`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *    limit - <Number> optional: The number of items to fetch per pagination.
  *            default -> 8
  *
  *
  *
  *  Events:
  *
  *
  *    'file-items-sorted' - Fired after <drag-drop-list> items are sorted by user drag action.
  *                              detail -> {sorted} - array of item uid's
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
  *
  **/


import {AppElement, html}        from '@longlost/app-core/app-element.js';
import {firebase}                from '@longlost/app-core/boot/boot.js';
import {hijackEvent, isOnScreen} from '@longlost/app-core/utils.js';
import {ItemsMixin}              from './items-mixin.js';
import htmlString                from './afs-file-items.html';
import '@longlost/drag-drop-list/drag-drop-list.js';
import '@polymer/iron-icon/iron-icon.js';
import './afs-file-item.js';
import '../shared/afs-file-icons.js';


const db = firebase.firestore();


class AFSFileItems extends ItemsMixin(AppElement) {
  static get is() { return 'afs-file-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      coll: {
        type: String,
        observer: '__collChanged'
      },

      // How many items to fetch and render at a time while paginating.
      limit: {
        type: Number,
        value: 8
      },

      // Cached order in which shuffled file items 
      // are ordered (translated by <drag-drop-list>
      // and reused by <template is="dom-repeat">), so saves 
      // by other devices can be correcly displayed locally.
      _domState: Array,  

      // DB subscription results.
      // This array drives the dom-repeat template and is
      // corrected for drag-drop-files sort actions.
      _items: {
        type: Array,
        value: () => ([])
      },

      _page: {
        type: Number,
        value: 0
      },

      _subscriptions: {
        type: Object,
        value: () => ({})
      },

      _trigger: Object,

      _triggered: Boolean

    };
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.__reset();
  }


  static get observers() {
    return [
      '__itemsChanged(_items.*)',
      '__openedPageChanged(opened, _page)',
      '__triggeredChanged(_triggered)',
      '__triggerElementChanged(_trigger)'
    ];
  }


  __computeHideIcons(items) {
    return !items || items.length < 2;
  }


  __collChanged(newVal, oldVal) {
    if (!newVal || (oldVal && newVal !== oldVal)) {
      this.__reset();
    }
  }


  __updateItems(start, results) {

    // Test if incoming results have previous local state.
    if (this._domState && this._domState.length >= (start + results.length)) {

      results.forEach((result, index) => {

        const pageIndex  = start + index;
        const stateIndex = this._domState[pageIndex];

        if (typeof stateIndex === 'number') {
          this.splice('_items', stateIndex, 1, result);
        }
        else {
          this.splice('_items', pageIndex, 1, result);



          // Remove this else statement if not needed.
          console.log('no state found, pageIndex: ', pageIndex, ' index: ', result.index);

        }

      });


    }
    else {        
      this.splice('_items', start, results.length, ...results); 
    }
  }


  __removeDeletedItems(start, count) {

    // Test for deleted items.
    if (count < this.limit) {

      const total = this._items.length;
      const end   = start + count;

      // Delete operation.
      if (end < total) {

        // Remove unused dom elements from end of repeater.
        const diff = total - end;

        this.splice('_items', end, diff);
      }
    }
  }


  __startSubscription(subscription) {

    const {page, startAfter, unsubscribe} = subscription;

    // This page not ready to be fetched yet.
    if (typeof page !== 'number') { return; }

    // Previous page has not returned results yet.
    if (page > 0 && !startAfter) { return; }

    if (unsubscribe) {
      unsubscribe();
    }


    const start = page * this.limit;


    const callback = (results, doc) => {

      this.__updateItems(start, results);
      this.__removeDeletedItems(start, results.length);

      const nextSub = this._subscriptions[page + 1] || {};

      // Only start new subscriptions if the startAfter 
      // document has been changed.
      if (nextSub.startAfter && nextSub.startAfter.id === doc.id) { return; }

      const newSub = {...nextSub, startAfter: doc};

      // Add/update next page's startAfter doc ref.
      this._subscriptions[page + 1] = newSub;

      this.__startSubscription(newSub);
    };


    const errorCallback = error => {

      this._subscriptions[page] = undefined;
      this.splice('_items', start, this.limit);

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };


    let ref = db.collection(this.coll).
                orderBy('index', 'asc').
                orderBy('timestamp', 'asc');

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


    this._subscriptions[page].unsubscribe = newUnsubscribe;
  }


  __openedPageChanged(opened, page) {

    if (!this.coll) { return; }
     
    // Reset if parent overlay is closed.
    if (!opened) {
      this.__reset();
      return; 
    }

    const current      = this._subscriptions[page] || {};
    const subscription = {...current, page};

    this._subscriptions[page] = subscription;

    this.__startSubscription(subscription);
  }


  __unsub() {

    Object.values(this._subscriptions).forEach(sub => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });

    this._subscriptions = {};
  }


  __reset() {
    this.__unsub();
    this._items     = [];
    this._page      = 0;
    this._trigger   = undefined;
    this._triggered = false;
  }


  __itemsChanged(polymerObj) {
    if (!polymerObj || !polymerObj.base) { return; }

    this.fire('items-changed', {value: polymerObj.base});
  }


  async __handleSort(event) {
    hijackEvent(event);

    // Take a snapshot of current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.
    const {items} = event.detail;

    this._domState = items.map(item => item.stateIndex);

    const sorted = items.
                     map((el, index) => {                      
                       if (el.item.index !== index) { // Only changes need to be saved.
                         return {...el.item, index};
                       }
                     }).
                     filter(item => item);

    this.fire('file-items-sorted', {sorted});
  }


  __triggeredChanged(triggered) {

    if (!triggered) { return; }

    this._page      = this._page + 1;
    this._triggered = false;
  }


  async __triggerElementChanged(trigger) {
    try {

      if (!trigger) { return; }

      await isOnScreen(trigger);

      this._trigger   = undefined;
      this._triggered = true;
    }
    catch (error) {

      // Offscreen elements may be removed
      // during delete actions of visible items.
      // Reissue a new trigger.
      if (error === 'Element removed.') {
        const elements = this.selectAll('.item');

        this._trigger = elements[elements.length - 1];
      }
      else {
        console.error(error);
      }
    }
  }


  __domChanged() {

    // Inform 'list-overlay-mixin' of change.
    this.fire('app-file-system-list-items-dom-changed');

    if (this._items.length === 0) { return; }

    const elements = this.selectAll('.item');

    if (elements.length !== this._items.length) { return; }

    this._trigger = elements[elements.length - 1];
  }

}

window.customElements.define(AFSFileItems.is, AFSFileItems);
