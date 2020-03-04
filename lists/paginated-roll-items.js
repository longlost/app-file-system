
/**
  * `paginated-roll-items`
  * 
  *   Accepts files from user and handles 
  *   uploading/saving/optimization/deleting/previewing/rearranging.
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
  *    files - <Array> required: Input items from Firestore db.
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
  *    cancelUploads() - Cancels each item's active file upload.
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


class CameraRoll extends AppElement {
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

      // Input items from db.
      files: Array,

	    hideCheckboxes: Boolean,

      // From outter template repeater.
      index: Number,

      // How many items to fetch and render at a time while paginating.
      limit: {
      	type: Number,
      	value: 8
      },

      // Passed in Firestore startAfter to paginate further results.
      // Is the previous element's last snapshot doc.
      pagination: Object,

      // Drives <template is="dom-repeat">
      _combinedFileItems: {
        type: Array,
        computed: '__computeCombinedFileItems(_items, files)'
      },

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
      '__collChanged(coll, index, pagination)',
      '__dataChanged(_data)',
      '__docTriggeredChanged(_doc, _triggered)',
      '__triggerChanged(_trigger)'
    ];
  }


  disconnectedCallback() {
    super.disconnectedCallback();

    this.__unsub();
  }

  // Combine incomming file obj with db item.
  // File obj is fed to <upload-controls>.
  __computeCombinedFileItems(items, files) {

    if (!items || items.length === 0) { return; }
    if (!files || Object.keys(files).length === 0) { return items; }

    const fileItems = items.map(item => {

      const match = files[item.uid];

      if (!match) {
        // Remove file prop.
        const {file, ...rest} = item; 
        return {...rest};
      }
      // Add file to item.
      return {...item, file: match};
    });

    return fileItems;
  }


  __computeData(items) {
  	if (!Array.isArray(items)) { return; }

  	return items.reduce((accum, item) => {
  		accum[item.uid] = item;
  		return accum;
  	}, {});
  }

  // Start a subscription to file data changes.
  async __collChanged(coll, index, pagination) {
    if (!coll || typeof index !== 'number') { return; }

    // Only first set of elements can run 
    // without a pagination snapshot doc.
    if (index > 0 && !pagination) { return; }

    if (this._unsubscribe) {
      this.__unsub();
    }
    else { 

      // App is still initializing, 
      // so give <app-settings> time to call enablePersistence
      // on services before calling subscribe.
      await wait(500);
    }


    const callback = (results, doc) => {

      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      this._items = results.filter(obj => obj.uid);
      this._doc 	= doc;
    };


    const errorCallback = error => {
      this._items  = undefined;

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };


    let ref = db.collection(coll).orderBy('timestamp', 'desc');

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


  cancelUploads(uids) {
    const elements = this.selectAll('.item');

    // 'uids' is optional.
    const elsToCancel = uids ? 
      uids.map(uid => elements.find(el => el.item.uid === uid)) : 
      elements;

    elsToCancel.forEach(element => {
      element.cancelUpload();
    });
  }

}

window.customElements.define(CameraRoll.is, CameraRoll);