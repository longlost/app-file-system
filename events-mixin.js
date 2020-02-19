

import {
  hijackEvent,
  listen,  
  schedule,
  unlisten,
  wait,
  warn
}               		 from '@longlost/utils/utils.js';
import services 		 from '@longlost/services/services.js';
// Will NOT download multiple files in Chrome when dev tools is open!!
import multiDownload from 'multi-download';
// Will NOT print pdf's in Chrome when dev tools is open!!
import printJS  		 from 'print-js'; 
import '@longlost/app-overlays/app-modal.js';
import '@longlost/app-spinner/app-spinner.js';


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

  // printJS cannot handle all file types.
  // The print button should be disabled
  // to not allow this type of file.
  throw new Error(`Cannot print this type of file. Type - ${type}`);
};

// Will NOT print pdf's in Chrome when dev tools is open!!
const printItem = async item => {
  const {displayName, original, type, _tempUrl} = item;

  const style = `.custom-h3 { 
		font-family: 'Roboto', 'Noto', Arial, Helvetica, sans-serif; 
	}`;

	const header = `<h3 class="custom-h3">${displayName}</h3>`;

	// Use temporary reference for files that are not done uploading.
  const printable = original ? original : _tempUrl;
  const printType = getPrintType(type);
 
  return printJS({
    header,
    printable,
    style,
    type: printType
  });
};

// Will NOT print pdf's in Chrome when dev tools is open!!
const printImages = items => {
  const someAreNotImages = items.some(item => !
    item.type.includes('image'));

  if (someAreNotImages) {
    throw new Error('Can only print multiple image files.');
  }

  // Use temporary file reference until file has been uploaded.
  const urls = items.map(({original, _tempUrl}) => 
    original ? original : _tempUrl);
  
  return printJS({
    imageStyle: 'display: inline-block; float: left; width: calc(50% - 16px); margin: 8px;',
    printable:   urls,
    type:       'image'
  });
};


export const EventsMixin = superClass => {
  return class EventsMixin extends superClass {


    static get properties() {
      return { 

	      // When deleting an item with drag and drop,
	      // or with item delete icon button,
	      // this is used to temporary cache the item(s)
	      // while the delete confirm modal is open.
	      _deleteItems: Array,

	      _downloadsListenerKey: Object,

	      _editFileListenerKey: Object,

	      _editImageListenerKey: Object,

	      // From <file-sources>.
	      _files: Object,

	      _openCarouselListenerKey: Object,

	      _printListenerKey: Object,

	      _printsListenerKey: Object,

	      _requestDeleteListenerKey: Object,

	      _requestDeletesListenerKey: Object,

	      _shareListenerKey: Object,

	      // Using a seperate data-binding here
	      // so top level elements can receive updates
	      // dynamically to item if it's being 
	      // processed in the cloud or worked on collaboratively.
	      _liveItem: {
	      	type: Object,
	      	computed: '__computeLiveItem(_liveUid, _dbData)'
	      },

	      _liveUid: String,

	      _sortedListenerKey: Object,

	      _updateListenerKey: Object,

      	_uploadListenerKey: Object

      };
    }


	  connectedCallback() {
	    super.connectedCallback();

	    // <file-list>
	    this._downloadsListenerKey = listen(
	      this, 
	      'download-items', 
	      this.__downloadItems.bind(this)
	    );

	    // <quick-options>
	    this._editFileListenerKey = listen(
	      this, 
	      'edit-file', 
	      this.__editFile.bind(this)
	    );

	    // <file-item>, <photo-carousel>
	    this._editImageListenerKey = listen(
	      this, 
	      'edit-image', 
	      this.__editImage.bind(this)
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

	    // <file-items> and <file-item>
	    this._requestDeletesListenerKey = listen(
	      this, 
	      'request-delete-items', 
	      this.__requestDeleteItems.bind(this)
	    );

	    // <quick-options>, <file-editor>, <photo-carousel>
	    this._shareListenerKey = listen(
	      this, 
	      'share-item', 
	      this.__shareItem.bind(this)
	    );

	    // <file-editor>, <image-editor>
	    this._updateListenerKey = listen(
	      this, 
	      'update-item', 
	      this.__updateItem.bind(this)
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
	    
	    unlisten(this._downloadsListenerKey);
	    unlisten(this._editFileListenerKey);
	    unlisten(this._editImageListenerKey);
	    unlisten(this._openCarouselListenerKey);
	    unlisten(this._printListenerKey);    
	    unlisten(this._printsListenerKey);
	    unlisten(this._requestDeleteListenerKey);
	    unlisten(this._requestDeletesListenerKey);
	    unlisten(this._shareListenerKey);
	    unlisten(this._sortedListenerKey);
	    unlisten(this._updateListenerKey);
	    unlisten(this._uploadListenerKey);
	    this.__unsub();
	  }

	  // So top level elements can receive real-time updates to item.
	  __computeLiveItem(uid, data) {
	  	if (!uid || !data) { return; }

	  	return data[uid];
	  }

	  // Will NOT download multiple files in Chrome when dev tools is open!!
	  async __downloadItems(event) {
	  	try {
	      await this.$.spinner.show('Preparing downloads.');

	      const {items} = event.detail;

	    	const urls = items.map(({original, _tempUrl}) => 
	    							 	 original ? original : _tempUrl);

	      // Show the spinner for at least 1sec, 
	      // but longer if downloading several files.
	      await Promise.all([multiDownload(urls), wait(1000)]);
	    }
	    catch (error) {
	      console.error(error);
	      await warn('An error occured while trying to download your files.');
	    }
	    finally {
	      this.$.spinner.hide();
	    }	    
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

	  // From <file-item> (image files only) and <roll-item>
	  async __openCarousel(event) {

	  	const {item, measurements} = event.detail;

	  	// TODO:
	  	// 			use measurements to create an expanding 
	  	//			animation from current item location into fullscreen.


	  	this._liveUid = item.uid;
	  	await schedule();
	    await import('./carousel/photo-carousel.js');
	    this.$.carousel.open(measurements);
	  }

	  // From <quick-options>, <file-item>
	  async __editFile(event) {
	  	const {item} 	= event.detail;
	  	this._liveUid = item.uid;

	  	await schedule();
	    await import('./editors/file-editor.js');

	    this.$.fileEditor.open();
	  }

	  // From <photo-carousel>
	  async __editImage(event) {
	  	const {item} 	= event.detail;
	  	this._liveUid = item.uid;

	  	await schedule();
	    await import('./editors/image-editor.js');

	    this.$.imageEditor.open();
	  }


	  async __printItem(event) {
	    try {
	      await this.$.spinner.show('Preparing file for printing.');

	      const {item} = event.detail;

	      // Show the spinner for at least 1sec, 
	      // but longer if printing large files.
	      await Promise.all([printItem(item), wait(1000)]);
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
	      await this.$.spinner.show('Preparing images for printing.');

	      const {items} = event.detail;

	      // Show the spinner for at least 1sec, 
	      // but longer if printing large files.
	      await Promise.all([printImages(items), wait(1000)]);
	    }
	    catch (error) {
	      console.error(error);
	      await warn('An error occured while trying to print your images.');
	    }
	    finally {
	      this.$.spinner.hide();
	    }
	  }

	  // 'upload-complete' events from <upload-controls> 
	  // which are nested children of <preview-lists>.
	  async __fileUploadComplete(event) {
	    hijackEvent(event);

	    const {uid, original, path} = event.detail;

	    // Merge with existing file data.
	    const fileData = {...this._dbData[uid], original, path}; 

	    this.$.sources.delete(uid);

	    await this.__saveFileData({[uid]: fileData});

	    this.fire('file-uploaded', fileData);
	  }


	  async __requestDeleteItem(event) {
	    hijackEvent(event);

	    this._deleteItems = [event.detail.item];

	    await schedule();

	    this.$.deleteConfirmModal.open();
	  }


	  async __requestDeleteItems(event) {
	    hijackEvent(event);

	    this._deleteItems = event.detail.items;

	    await schedule();

	    this.$.deleteConfirmModal.open();
	  }

	  // <drag-drop> delete area modal.
	  async __confirmDeleteBtnClicked(event) {
	    try {
	      hijackEvent(event);
	      await this.clicked();

	      await this.$.deleteConfirmModal.close();

	      // Reset drag-drop delete if applicable.
	      this.$.lists.resetDeleteTarget();

	      // Close editors since their item is now gone.
	      // Test for close method since these elements
	      // are lazy loaded and may not yet exist.
	      if (this.$.fileEditor.reset) {
	      	this.$.fileEditor.reset();
	      }

	      if (this.$.imageEditor.reset) {
	      	this.$.imageEditor.reset();
	      }

	      // Delete methods show different spinner messages.
	      if (this._deleteItems.length > 1) {

	      	const uids = this._deleteItems.map(item => item.uid);

	      	await this.deleteMultiple(uids);
	      }
	      else {
	      	await this.delete(this._deleteItems[0].uid);
	      }
	    }
	    catch (error) {
	      if (error === 'click disabled') { return; }
	      console.error(error);
	    }
	    finally {
	      this._deleteItems = undefined;
	    }
	  }


	  async __dismissDeleteBtnClicked(event) {
	    try {
	      hijackEvent(event);

	      await this.clicked();
	      await this.$.deleteConfirmModal.close();

	      // Reset drag-drop delete if applicable.
	      this.$.lists.cancelDelete();
	    }
	    catch (error) {
	      if (error === 'click debounced') { return; }
	      console.error(error);
	    }
	    finally {
	      this._deleteItems = undefined;
	    }
	  }


	  async __shareItem(event) {
	  	const {item} 	= event.detail;
	  	this._liveUid = item.uid;

	  	await schedule();
	  	await import('./share-modal.js');

	  	this.$.shareModal.open();
	  }

	  // Issue new file metadata so download 
	  // filename reflects new displayName.
	  async __updateContentDisposition(item) {
	  	const {displayName, ext, path, uid} = item;
	  	const currentItem = this._dbData[uid];

	  	// Only need to run this if there is 
	  	// an update to display name.
	  	if (displayName !== currentItem.displayName) {

	  		await this.$.spinner.show('Updating file.');

	  		const metadata = await services.getMetadata(path);

        const newMetadata = {
        	...metadata, 
        	contentDisposition: `attachment; filename="${displayName}${ext}"`
        };

        await services.updateMetadata(path, newMetadata);
	  	}
	  }

	  // From <share-modal>, <metadata-editor> and <image-editor>.
	  async __updateItem(event) {
	  	try {

		  	const {item} = event.detail;
		  	
		  	await this.__updateContentDisposition(item);

		  	await this.__saveFileData({[item.uid]: item});
	  	}
	  	catch (error) {
	  		console.error(error);
	  		await warn('An error occured while updating the file.');
	  	}
	  	finally {
	  		this.$.spinner.hide();	  		
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
