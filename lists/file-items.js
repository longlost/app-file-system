

/**
  * `file-items`
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
  *    hideDropzone - <Boolean> optional: undefined -> When true, hide delete dropzone.
  *
  *
  *    items - <Array> required: Input items from Firestore db.
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
  *    'request-delete-item' - Fired when a user drags an item over the delete dropzone.
  *                            detail -> {uid} - item uid
  *                                   
  *
  *  
  *  Methods:
  *
  *
  *    cancelDelete() - User dismisses the delete modal in <file-list> parent element.
  *
  *
  *    cancelUploads() - Cancels each item's active file upload.
  *              
  *
  *    delete() - Removes the highest index found in the _domState correction array.
  *               The reason for removing the highest index is because the <template is="dom-repeat">
  *               element removes the last item in the array of dom elements no matter which item index
  *               is actually removed.
  *
  *    
  *    resetDeleteTarget() - Clears corrective styles applied to an element dragged onto the dropzone, 
  *                          following a dismissed or confirmed delete action.
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html}  from '@longlost/app-element/app-element.js';
import {ItemsMixin}        from './items-mixin.js';
import {firebase}          from '@longlost/boot/boot.js';
import {removeOne}         from '@longlost/lambda/lambda.js';
import {hijackEvent, isOnScreen, wait} from '@longlost/utils/utils.js';
import htmlString          from './file-items.html';
import '@longlost/drag-drop-list/drag-drop-list.js';
import '@polymer/iron-icon/iron-icon.js';
import './paginated-file-items.js';
import '../shared/file-icons.js';


const db = firebase.firestore();


const dropIsOverDropZone = ({top, right, bottom, left, x, y}) => {
  if (y < top  || y > bottom) { return false; }
  if (x < left || x > right)  { return false; }
  return true;
};


class FileItems extends ItemsMixin(AppElement) {
  static get is() { return 'file-items'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      coll: {
        type: String,
        observer: '__collChanged'
      },

      // Set to true to hide the delete dropzone.
      hideDropzone: Boolean,  

      // How many items to fetch and render at a time while paginating.
      limit: {
        type: Number,
        value: 8
      },

      // Firebase subscription doc used for pagination.
      _docs: {
        type: Array,
        value: () => ({})
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




      _unsubscribes: {
        type: Array,
        value: () => ([])
      }

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

        const pageIndex = start + index;

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


  __removeDeletedItems(count, start) {

    // Test for deleted items.
    if (count < this.limit) {

      const end = start + count;

      // Delete operation.
      if (end < this._items.length) {

        // Remove unused dom elements from end of repeater.
        const diff = this._items.length - end;

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
      this.__removeDeletedItems(results.length, start);

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


    const current = this._subscriptions[page] || {};

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


  __putTargetWhereDropped() {
    const {target, x, y} = this._toDelete;

    // Make sure item covers, or layers over, the dropzone.
    target.style['z-index']   = '1';
    target.style['transform'] = `translate3d(${x}px, ${y}px, 1px)`;
  }

  // See if item was dropped over the delete area
  // compare pointer coordinates with area position.
  async __handleDrop(event) {
    hijackEvent(event);

    const {data, target}             = event.detail;
    const {x, y}                     = data;
    const {top, right, bottom, left} = this.$.dropZone.getBoundingClientRect();
    const measurements               = {top, right, bottom, left, x, y};

    if (dropIsOverDropZone(measurements)) {

      const {uid}                    = target.item;
      const {x: targetX, y: targetY} = target.getBoundingClientRect();      

      // Override transform to keep item over delete zone.
      this._toDelete = {target, x: targetX, y: targetY};
      this.__putTargetWhereDropped();

      // Show a confirmation modal before deleting.
      this.fire('request-delete-item', {uid});
    }
  }

  // <drag-drop-list> artifact that requires correction
  // so placement does not change.
  __correctForDragDropList() {
    const {target, x, y}     = this._toDelete;
    const {x: newX, y: newY} = target.getBoundingClientRect();

    target.style['transform'] = `translate3d(${x - newX}px, ${y - newY}px, 1px)`;
  }


  async __handleSort(event) {
    hijackEvent(event);

    if (this._toDelete) {
      this.__correctForDragDropList();
    }

    // Take a snapshot of current sequence 
    // of items to correct an issue with 
    // using a <template is="dom-repeat"> 
    // inside <drag-drop-list>.

    const {items} = event.detail;

    this._domState = items.map(item => item.stateIndex);

    const sorted = items.
                     map((el, index) => el.item ? {...el.item, index} : undefined).
                     filter(uid => uid);

    this.fire('file-items-sorted', {sorted});
  }


  __triggeredChanged(triggered) {

    if (!triggered) { return; }

    this._page       = this._page + 1;
    this._triggered  = false;
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

    if (this._items.length === 0) { return; }

    const elements = this.selectAll('.item');

    if (elements.length !== this._items.length) { return; }

    this._trigger = elements[elements.length - 1]; 
  }


  cancelDelete() {
    if (!this._toDelete) { return; }

    this.resetDeleteTarget();
  }




  // Must setup the right correction technique BEFORE
  // the items change handler is triggered by next db save
  // that occurs during a delete operation.
  delete() { 

    // Take out largest index since the <template is="dom-repeat">
    // always removes the last item from the dom.
    // Find the largest index in the state array 
    // and remove it.
    // const index = this._domState.findIndex(num => 
    //                 num === this._domState.length - 1);

    // this._domState = removeOne(index, this._domState);
  }





  async resetDeleteTarget() {
    if (!this._toDelete) { return; }

    const {target} = this._toDelete;

    target.style['transition'] = 'transform 0.2s var(--custom-ease)';
    target.style['transform']  = '';

    await wait(250);

    // Set z-index to an unrecognized value
    // so <drag-drop-list> can control
    // with css classes.
    target.style['z-index']    = '';
    target.style['transition'] = 'unset';
    this._toDelete             = undefined;
  }

}

window.customElements.define(FileItems.is, FileItems);
