
/**
  * `paginated-roll-items`
  * 
  *   Paginates photo items from db as user scrolls.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  *    uploads - <Array> required: File upload controls, progress and state.
  *
  *
  *
  *
  *  
  *  Methods:
  *
  *
  *
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  isOnScreen,
  wait
}                 from '@longlost/utils/utils.js';
import {firebase} from '@longlost/boot/boot.js';
import htmlString from './paginated-roll-items.html';
import './roll-item.js';


const db = firebase.firestore();


class PaginatedRollItems extends AppElement {
  static get is() { return 'paginated-roll-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // From tri-state multiselect-btns.
      // Select all item checkboxes when true.
      all: Boolean,

      // Firestore coll path string.
      coll: String,

      hideCheckboxes: Boolean,

      // From outter template repeater.
      index: Number,

      // How many items to fetch and render at a time while paginating.
      limit: {
        type: Number,
        value: 8
      },

      // Only run db item subscriptions when overlay is open.
      opened: Boolean,

      // Passed in Firestore startAfter to paginate further results.
      // Is the previous element's last snapshot doc.
      pagination: Object,

      // File upload controls, progress and state.
      uploads: Object,

      _data: {
        type: Object,
        computed: '__computeData(_items)'
      },

      // This element's last snapshot doc.
      _doc: Object,

      // Input items from db.
      _items: Array,

      // Last element in sub-sequence.
      // Used to trigger next pagination.
      _trigger: Object,

      _triggered: {
        type: Boolean,
        value: false
      },

      // Services/Firestore subscription unsubscribe function.
      _unsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__collChanged(coll, index, opened, pagination)',
      '__dataChanged(_data)',
      '__docTriggeredChanged(_doc, _triggered)',
      '__triggerChanged(_trigger)'
    ];
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.__unsub();
  }


  __computeData(items) {
    if (!Array.isArray(items)) { return; }

    return items.reduce((accum, item) => {
      accum[item.uid] = item;
      return accum;
    }, {});
  }

  // Start a subscription to file data changes.
  async __collChanged(coll, index, opened, pagination) {
    if (!coll || typeof index !== 'number') { return; }    

    // Only first set of elements can run 
    // without a pagination snapshot doc.
    if (index > 0 && !pagination) { return; }
    
    // Cancel previous subscription.
    this.__unsub();

    // Don't start a new subscription if parent overlay is closed.
    if (!opened) { return; }

    const callback = (results, doc) => {

      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      this._items = results.filter(obj => obj.uid);
      this._doc   = doc;
    };

    const errorCallback = error => {
      this._items  = undefined;

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };

    // Will need to create an index in Firestore.
    // Only images and/or videos for camera-roll.
    let ref = db.collection(coll).
                where('category', 'in', ['image', 'video']).
                orderBy('timestamp', 'desc');

    if (pagination) {
      ref = ref.startAfter(pagination);
    }

    this._unsubscribe = ref.limit(this.limit).onSnapshot(snapshot => {

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
  }


  __unsub() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }


  __dataChanged(data) {
    if (!data) { return; }

    this.fire('item-data-changed', {value: data});
  }


  async __triggerChanged(trigger) {
    if (!trigger) { return; }

    await isOnScreen(trigger);

    this._triggered = true;
  }


  __docTriggeredChanged(doc, triggered) {

    if (!doc || !triggered) { return; }

    this.fire('new-pagination-doc', {doc, index: this.index});
  }


  __domChanged() {

    // Already paginated.
    if (this._triggered || !Array.isArray(this._items)) { return; }

    const elements = this.selectAll('.item');

    if (elements.length !== this._items.length) { return; }

    this._trigger = elements[elements.length - 1];
  }

}

window.customElements.define(PaginatedRollItems.is, PaginatedRollItems);
