
import {
  hijackEvent,
  listen,  
  schedule,
  unlisten,
  warn
}              from '@longlost/utils/utils.js';
import printJS from 'print-js';


const getPrintType = type => {
  if (type.includes('image')) {
    return 'image';
  }
  if (type.includes('pdf')) {
    return 'pdf';
  }
  if (type.includes('json')) {
    return 'json';
  }
  if (type.includes('html')) {
    return 'html';
  }
};


const printItem = item => {
  const {original, _tempUrl, displayName, type} = item;

  const printable = original ? original : _tempUrl;
  const printType = getPrintType(type);

  // header: '<h3 class="custom-h3">My custom header</h3>',
  // style: '.custom-h3 { color: red; }'

  return printJS({
    header: displayName,
    printable, 
    type: printType
  });
};


const printImages = items => {
  const someAreNotImages = items.some(item => !
    item.type.includes('image'));

  if (someAreNotImages) {
    throw new Error('printImages only accepts image files!');
  }

  const urls = items.map(({original, _tempUrl}) => 
    original ? original : _tempUrl);

  return printJS({
    printable:   urls,
    type:       'image',
    imageStyle: 'width:calc(50% - 16px);margin:8px;'
  });
};


export const EventsMixin = superClass => {
  return class EventsMixin extends superClass {


    static get properties() {
      return {        

	      // Displayed name in delete modal.
	      _deleteName: {
	        type: String,
	        computed: '__computeDeleteItemDisplayName(_items, _deleteUid)'
	      },

	      // When deleting an item with drag and drop,
	      // or with item delete icon button,
	      // his is used to temporary cache the uid
	      // while the delete confirm modal is open.
	      _deleteUid: String,

	      _downloadsListenerKey: Object,

	      // From <file-sources>.
	      _files: Object,

	      _printListenerKey: Object,

	      _printsListenerKey: Object,

	      _requestDeleteListenerKey: Object,

      	_uploadListenerKey: Object

      };
    }    


	  __computeDeleteItemDisplayName(items, uid) {
	    if (!items || !uid) { return; }

	    const match = items.find(item => item.uid === uid);

	    return match ? match.displayName : '';
	  }


	  connectedCallback() {
	    super.connectedCallback();

	    // <file-list>
	    this._downloadsListenerKey = listen(
	      this, 
	      'download-items', 
	      this.__downloadItems.bind(this)
	    );

	    // Events from <file-items> which is
	    // a child of <file-list>
	    this._sortedListenerKey = listen(
	      this,
	      'file-items-sorted',
	      this.__itemsSorted.bind(this)
	    );

	    this._openCarouselListenerKey = listen(
	      this,
	      'open-carousel',
	      this.__openCarousel.bind(this)
	    );

	    // <file-list>, <quick-options>
	    this._printListenerKey = listen(
	      this, 
	      'print-item', 
	      this.__printItem.bind(this)
	    );

	    // <file-list>
	    this._printsListenerKey = listen(
	      this, 
	      'print-images', 
	      this.__printImages.bind(this)
	    );

	    // <file-items> and <file-item>
	    this._requestDeleteListenerKey = listen(
	      this, 
	      'request-delete-item', 
	      this.__requestDeleteItem.bind(this)
	    );

	    // Events from <upload-controls> which 
	    // are nested children of <preview-lists>.
	    this._uploadListenerKey = listen(
	      this, 
	      'upload-complete', 
	      this.__fileUploadComplete.bind(this)
	    );
	  }


	  disconnectedCallback() {
	    super.disconnectedCallback();
	    
	    unlisten(this._uploadListenerKey);
	    unlisten(this._downloadsListenerKey);
	    unlisten(this._printListenerKey);    
	    unlisten(this._printsListenerKey);
	    unlisten(this._requestDeleteListenerKey);
	    this.__unsub();
	  }


	  __downloadItems(event) {
	    // const {items} = event.detail;
	    console.log('__downloadItems');
	  }


	  // 'file-items-sorted' events from <file-items>
	  // which is a child of <preview-lists>
	  __itemsSorted(event) {

	    // An array of uid's ordered by user
	    // by drag and drop reordering.
	    const {sorted} = event.detail;

	    const newIndexes = sorted.reduce((accum, uid, index) => {
	      accum[uid] = {...this._dbData[uid], index};
	      return accum;
	    }, {});

	    this.__saveFileData(newIndexes);
	  }


	  async __openCarousel(event) {
	    await import('./carousel/photo-carousel.js');
	    this.$.carousel.open(event.detail);
	  }


	  async __openEditor() {
	    await import('./editor/image-editor.js');
	    this.$.editor.open();
	  }


	  async __printItem(event) {
	    try {
	      await this.$.spinner.show('Getting file ready for printing.');

	      const {item} = event.detail;

	      await printItem(item);
	    }
	    catch (error) {
	      console.error(error);
	      await warn('An error occured while trying to print your file.');
	    }
	    finally {
	      this.$.spinner.hide();
	    }
	  }


	  async __printImages(event) {
	    try {
	      await this.$.spinner.show('Getting images ready for printing.');

	      const {items} = event.detail;

	      await printImages(items);
	    }
	    catch (error) {
	      console.error(error);
	      await warn('An error occured while trying to print your files.');
	    }
	    finally {
	      this.$.spinner.hide();
	    }
	  }

	  // 'upload-complete' events from <upload-controls> 
	  // which are nested children of <preview-lists>.
	  async __fileUploadComplete(event) {
	    hijackEvent(event);

	    const {uid, original, path: storagePath} = event.detail;

	    // Merge with existing file data.
	    const fileData = {...this._dbData[uid], original, path: storagePath}; 

	    this.$.sources.delete(uid);

	    await this.__saveFileData({[uid]: fileData});

	    this.fire('file-uploaded', fileData);
	  }


	  async __requestDeleteItem(event) {
	    hijackEvent(event);

	    this._deleteUid = event.detail.uid;

	    await schedule();

	    this.$.deleteConfirmModal.open();
	  }

	  // <drag-drop> delete area modal.
	  async __confirmDeleteButtonClicked(event) {
	    try {
	      hijackEvent(event);
	      await this.clicked();

	      await this.$.deleteConfirmModal.close();

	      this.$.lists.resetDeleteTarget();

	      this.delete(this._deleteUid);
	    }
	    catch (error) {
	      if (error === 'click disabled') { return; }
	      console.error(error);
	    }
	  }


	  async __dismissDeleteConfirmButtonClicked(event) {
	    try {
	      hijackEvent(event);

	      await this.clicked();
	      await this.$.deleteConfirmModal.close();

	      this.$.lists.cancelDelete();
	    }
	    catch (error) {
	      if (error === 'click debounced') { return; }
	      console.error(error);
	    }
	  }

	  // <file-sources> 'files-changed' event.
	  __sourcesFilesChanged(event) {
	    hijackEvent(event);

	    this._files = event.detail.value;
	    this.__addNewFileItems(this._files);
	  }

  };
};
