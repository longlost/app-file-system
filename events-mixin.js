
/**
	*		Common events from nested child elements are handled here.
	*
	*
	*
	**/

import {
  hijackEvent,
  schedule,
  wait,
  warn
} from '@longlost/app-core/utils.js';

import {
	getMetadata,
	setBatch,
	set,
	updateMetadata
} from '@longlost/app-core/services/services.js';

// Will NOT download multiple files in Chrome when dev tools is open!!
import multiDownload from 'multi-download';

// Will NOT print pdf's in Chrome when dev tools is open!!
import printJS from 'print-js'; 
import '@longlost/app-spinner/app-spinner.js';
import './modals/afs-delete-modal.js';

// Not lazy loaded so that afs may work in the background.
import './modals/afs-save-as-modal.js';


// From items array/collection back to a Firestore data obj.
const arrayToDbObj = array => {
	
  return array.reduce((accum, obj) => {
    accum[obj.uid] = obj;
    return accum;
  }, {});
};   


const getPrintable = item => {

	const {_tempUrl, original, optimized, poster, thumbnail, type} = item;

	// Must handle video differently since the printables
	// are all handled in the cloud and may fail.
	// Cannot use '_tempUrl' or 'original' for video
	// as those point to the video file, not the still posters.
	if (type.includes('video')) {

		if (poster) { return poster; }

		return optimized ? optimized : thumbnail;
	}

	if (original) { return original; }

	return _tempUrl;
}; 


const getPrintType = type => {

  if (type.includes('image') || type.includes('video')) {
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

  const {displayName, type} = item;

  const style = `.custom-h3 { 
		font-family: 'Roboto', 'Noto', Arial, Helvetica, sans-serif; 
	}`;

	const header = `<h3 class="custom-h3">${displayName}</h3>`;

	// Use temporary reference for files that are not done uploading.
  const printable = getPrintable(item);
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

  const someAreNotImages = items.some(item => 
  													 (!item.type.includes('image') || 
  													 	!item.type.includes('video')));

  if (someAreNotImages) {
    throw new Error('Can only print multiple image files.');
  }

  // Use temporary file reference until file has been uploaded.
  const urls = items.map(getPrintable);
  
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

	      // An object version of the items returned from the database.
	      // Used for quick and easy access to file items via uid.
	      _dbData: Object,

	      // When deleting an item with drag and drop,
	      // or with item delete icon button,
	      // this is used to temporary cache the item(s)
	      // while the delete confirm modal is open.
	      _deleteItems: Array,

	      // Using a seperate data-binding here
	      // so top level elements can receive updates
	      // dynamically to item if it's being 
	      // processed in the cloud or worked on collaboratively.
	      _liveItem: {
	      	type: Object,
	      	computed: '__computeLiveItem(_liveUid, _dbData)'
	      },

	      _liveUid: String

      };
    }


	  connectedCallback() {

	    super.connectedCallback();

	    this.__downloadItems 			= this.__downloadItems.bind(this);
	    this.__editFile 					= this.__editFile.bind(this);
	    this.__editImage 					= this.__editImage.bind(this);
	    this.__saveImage 					= this.__saveImage.bind(this);
	    this.__itemsChanged 			= this.__itemsChanged.bind(this);
	    this.__itemDataChanged 		= this.__itemDataChanged.bind(this);	    
	    this.__itemsSorted 				= this.__itemsSorted.bind(this);
	    this.__openCarousel 			= this.__openCarousel.bind(this);
	    this.__openPhotoViewer 		= this.__openPhotoViewer.bind(this);
	    this.__openVideoViewer 		= this.__openVideoViewer.bind(this);
	    this.__printItem 					= this.__printItem.bind(this);
	    this.__printImages 				= this.__printImages.bind(this);
	    this.__requestDeleteItem 	= this.__requestDeleteItem.bind(this);
	    this.__requestDeleteItems = this.__requestDeleteItems.bind(this);
	    this.__resumeCarousel 		= this.__resumeCarousel.bind(this);
	    this.__shareItem 					= this.__shareItem.bind(this);
	    this.__updateItem 				= this.__updateItem.bind(this);


	    // `file-list`
	    this.addEventListener('download-items', this.__downloadItems);

	    // `quick-options`
	    this.addEventListener('edit-file', this.__editFile);

	    // `file-item`, `photo-carousel`
	    this.addEventListener('edit-image', this.__editImage);

	    // <image-editor>
	    this.addEventListener('image-editor-save', this.__saveImage);

	    // `file-items`, `photo-carousel`
	    this.addEventListener('items-changed', this.__itemsChanged);

	    // `paginated-roll-items`
	    this.addEventListener('item-data-changed', this.__itemDataChanged);	    

	    // Events from `file-items` which is
	    // a child of `file-list`
	    this.addEventListener('file-items-sorted', this.__itemsSorted);

	    // `roll-item`
	    this.addEventListener('open-carousel', this.__openCarousel);

	    // `photo-carousel`, `file-editor`
	    this.addEventListener('open-photo-viewer', this.__openPhotoViewer);

	    // `file-editor`
	    this.addEventListener('open-video-viewer', this.__openVideoViewer);

	    // `file-list`, `quick-options`
	    this.addEventListener('print-item', this.__printItem);

	    // `file-list`
	    this.addEventListener('print-images', this.__printImages);

	    // `file-items` and `file-item`
	    this.addEventListener('request-delete-item', this.__requestDeleteItem);

	    // `file-items` and `file-item`
	    this.addEventListener('request-delete-items', this.__requestDeleteItems);

	    // `image-editor`
	    this.addEventListener('resume-carousel', this.__resumeCarousel);

	    // `quick-options`, `file-editor`, `photo-carousel`
	    this.addEventListener('share-item', this.__shareItem);

	    // `file-editor`, `image-editor`
	    this.addEventListener('update-item', this.__updateItem);
	  }


	  disconnectedCallback() {

	    super.disconnectedCallback();	    
	    
	    this.removeEventListener('download-items', 			 this.__downloadItems);
	    this.removeEventListener('edit-file', 					 this.__editFile);
	    this.removeEventListener('edit-image', 					 this.__editImage);
	    this.removeEventListener('image-editor-save', 	 this.__saveImage);
	    this.removeEventListener('items-changed', 			 this.__itemsChanged);
	    this.removeEventListener('item-data-changed', 	 this.__itemDataChanged);	 
	    this.removeEventListener('file-items-sorted', 	 this.__itemsSorted);
	    this.removeEventListener('open-carousel', 			 this.__openCarousel);
	    this.removeEventListener('open-photo-viewer', 	 this.__openPhotoViewer);
	    this.removeEventListener('open-video-viewer', 	 this.__openVideoViewer);
	    this.removeEventListener('print-item', 					 this.__printItem);
	    this.removeEventListener('print-images', 				 this.__printImages);
	    this.removeEventListener('request-delete-item',  this.__requestDeleteItem);
	    this.removeEventListener('request-delete-items', this.__requestDeleteItems);
	    this.removeEventListener('resume-carousel', 		 this.__resumeCarousel);
	    this.removeEventListener('share-item', 					 this.__shareItem);
	    this.removeEventListener('update-item', 				 this.__updateItem);
	  }

	  // So top level elements can receive real-time updates to item.
	  __computeLiveItem(uid, data) {

	  	if (!uid || !data) { return; }

	  	return data[uid];
	  }

	  // Will NOT download multiple files in Chrome when dev tools is open!!
	  async __downloadItems(event) {

	  	hijackEvent(event);

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

	  // From `file-items`
	  __itemsChanged(event) {

	  	hijackEvent(event);

	  	const items = event.detail.value;

	  	if (Array.isArray(items)) {
	  		this._dbData = arrayToDbObj(items);
	  	}
	  	else {
	  		this._dbData = {};
	  	}
	  }

	  // From `paginated-roll-items`
	  __itemDataChanged(event) {

	  	hijackEvent(event);

	  	// Merge incomming data with existing data.
	  	this._dbData = {...this._dbData, ...event.detail.value};
	  }

	  // 'file-items-sorted' events from <file-items>
	  // which is a child of <preview-lists>
	  __itemsSorted(event) {

	  	hijackEvent(event);

	    // An array of uid's ordered by user
	    // by drag and drop reordering.
	    const {sorted} = event.detail;

	    const newIndexes = sorted.map(item => ({
	    	coll: this.coll,
      	doc:  item.uid,
      	data: {index: item.index}
	    }));

	    setBatch(newIndexes);
	  }


	  __openSaveAsModal(event) {

	  	hijackEvent(event);

	  	this.$.saveAsModal.open(event.detail.files);
	  }


	  __saveAsModalSkip(event) {

	  	hijackEvent(event);

	  	this.$.sources.skipRenaming();
	  }


	  __saveAsModalUpdate(event) {

	  	hijackEvent(event);

	  	this.$.sources.uploadRenamed(event.detail.files);
	  }

	  // From <file-item> (image files only) and <roll-item>
	  async __openCarousel(event) {

	  	hijackEvent(event);

	  	const {item, measurements} = event.detail;

	  	this._liveUid = item.uid;

	    await import(
	    	/* webpackChunkName: 'afs-photo-carousel' */ 
	    	'./carousel/afs-photo-carousel.js'
	    );

	    this.select('#carousel').open(measurements);
	  }
	  
	  // From `file-editor` and `photo-carousel` (image files only)
	  async __openPhotoViewer(event) {

	  	hijackEvent(event);

	  	const {item, measurements} = event.detail;

	  	this._liveUid = item.uid;

	    await import(
	    	/* webpackChunkName: 'afs-photo-viewer' */ 
	    	'./viewers/afs-photo-viewer.js'
	    );

	    this.select('#photoViewer').open(measurements);
	  }

	  // From `file-editor` (video files only)
	  async __openVideoViewer(event) {

	  	hijackEvent(event);

	  	const {item} = event.detail;

	  	this._liveUid = item.uid;

	    await import(
	    	/* webpackChunkName: 'afs-video-viewer' */ 
	    	'./viewers/afs-video-viewer.js'
	    );

	    this.select('#videoViewer').open();
	  }

	  // From <quick-options>, <file-item>
	  async __editFile(event) {

	  	hijackEvent(event);

	  	const {item} 	= event.detail;
	  	this._liveUid = item.uid;

	  	await schedule();
	    await import(
	    	/* webpackChunkName: 'afs-file-editor' */ 
	    	'./editors/afs-file-editor.js'
	    );

	    this.select('#fileEditor').open();
	  }


	  async __openImageEditor(item) {

	  	const {uid} = item;

	  	// If opened directly (list or carousel not opened prior),
	  	// '_dbData' will still be undefined.
	  	if (!this._dbData) {
	  		this._dbData = {[uid]: item};
	  	}

	  	// Add the incoming image item to the list, if it's not 
	  	// already part of the current entries.
	  	if (!this._dbData[uid]) {
	  		this._dbData[uid] = item;
	  	}

	  	this._liveUid = uid;

	  	await schedule();
	    await import(
	    	/* webpackChunkName: 'afs-image-editor' */ 
	    	'./editors/afs-image-editor.js'
	    );
	    await this.select('#imageEditor').open();

	    // Only available when list === 'photos'.
	    this.select('#carousel')?.stop?.();
	  }

	  // From <photo-carousel>
	  __editImage(event) {

	  	hijackEvent(event);

	  	const {item} = event.detail;
	  	
	  	return this.__openImageEditor(item);
	  }


	  async __saveImage(event) {

	  	hijackEvent(event);

	  	await this.add(event.detail.value);
	  	
	  	this.select('#imageEditor').saved();
	  }


	  __resumeCarousel(event) {

	  	hijackEvent(event);

	  	// Only call resume if the carousel 
	  	// has been opened before.
	  	const carousel = this.select('#carousel');

	  	if (carousel && carousel.resume) {
	  		carousel.resume();
	  	}
	  }


	  async __printItem(event) {

	  	hijackEvent(event);

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

	  	hijackEvent(event);

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


	  __pauseUploads(uids) {

	    uids.forEach(uid => {
	      if (this._uploads[uid]) {
	        this._uploads[uid].controls.pause();
	      }
	    });
	  }


	  __resumeUploads(uids) {

	    uids.forEach(uid => {
	      if (this._uploads[uid]) {
	        this._uploads[uid].controls.resume();
	      }
	    });
	  }


	  async __requestDeleteItem(event) {

	    hijackEvent(event);

	    const {item} = event.detail;

	    this._deleteItems = [item];
	    this.__pauseUploads([item.uid]);

	    await schedule();

	    this.$.deleteConfirmModal.open([item]);
	  }


	  async __requestDeleteItems(event) {

	    hijackEvent(event);

	    const {items} = event.detail;
	    const uids 		= items.map(item => item.uid);

	    this._deleteItems = items;
	    this.__pauseUploads(uids);

	    await schedule();

	    this.$.deleteConfirmModal.open(items);
	  }


	  async __deleteModalDelete(event) {

	  	hijackEvent(event);

	  	try { 		

		  	// Close editors since their item is now gone.
	      // Test for close method since these elements
	      // are lazy loaded and may not yet exist.
	      const fileEditor 	= this.select('#fileEditor');
	      const imageEditor = this.select('#imageEditor');

	      if (fileEditor && fileEditor.reset) {
	      	fileEditor.reset();
	      }

	      if (imageEditor && imageEditor.reset) {
	      	imageEditor.reset();
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
	  		console.error(error);
	  	}
	  	finally {
	  		this._deleteItems = undefined;
	  	}
	  }


	  __deleteModalCanceled(event) {

	  	hijackEvent(event);

	  	const uids = this._deleteItems.map(item => item.uid);

    	this.__resumeUploads(uids);

      this._deleteItems = undefined;
	  }


	  async __shareItem(event) {

	  	hijackEvent(event);

	  	const {item} 	= event.detail;
	  	this._liveUid = item.uid;

	  	await schedule();
	  	await import(
	  		/* webpackChunkName: 'afs-share-modal' */ 
	  		'./modals/afs-share-modal.js'
	  	);

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

	  		const metadata = await getMetadata(path);

        const newMetadata = {
        	...metadata, 
        	contentDisposition: `attachment; filename="${displayName}${ext}"`
        };

        await updateMetadata(path, newMetadata);
	  	}
	  }

	  // From <share-modal>, <metadata-editor> and <image-editor>.
	  async __updateItem(event) {

	  	hijackEvent(event);

	  	try {

		  	const {item} = event.detail;
		  	
		  	await this.__updateContentDisposition(item);

		  	await set({
		      coll: this.coll,
		      doc:  item.uid,
		      data: item
		    });
	  	}
	  	catch (error) {
	  		console.error(error);
	  		await warn('An error occured while updating the file.');
	  	}
	  	finally {
	  		this.$.spinner.hide();	  		
	  	}
	  }

	  // Open a modal that allows the user to confirm an item selection
	  // when a list overlay is in selection mode.
	  async __listOverlayConfirmSelectionHandler(event) {

	    hijackEvent(event);

	    const {item} = event.detail;

	    await import(
        /* webpackChunkName: 'afs-confirm-selection-modal' */ 
        './modals/afs-confirm-selection-modal.js'
      );    

	    this.select('#confirmSelectionModal').open(item);
	  }


	  __confirmSelectionModalConfirmed(event) {

	  	hijackEvent(event);

	  	const id = this.list === 'files' ? '#fileList' : '#cameraRoll';

	  	this.select(id).close();
	  }


	  __confirmSelectionModalDismissed(event) {

	  	hijackEvent(event);

	  	const id = this.list === 'files' ? '#fileList' : '#cameraRoll';

	  	this.select(id).clearSelected();
	  }

  };
};
