

/**
	*		Issue a uid to all files via the `nanoid` library.
	*
	*		Extract EXIF data for supported image types.
	*
	*		Compress supported image files on device before upload
	* 	to decrease upload times and data usage. This also 
	* 	reduces the memory footprint of the image-editor, which
	*		is crucial for mobile devices.
	*
	**/

import * as Comlink from 'comlink';
import {nanoid}			from 'nanoid/non-secure'; // https://github.com/ai/nanoid
import {canProcess} from '@longlost/app-core/img-utils.js';


const process = async (readCb, processedCb, file) => {	
	const uid = nanoid(); // ie. 'Uakgb_J5m9g-0JDMbcJqLJ'.	

	// The file may not be passed since there is
	// no need to transfer a file accross contexts 
	// just to get a uid issued if it cannot be processed.
	// Don't process unsupported file types either.
	if (!file || !canProcess(file)) {

		// Update file read ui.
		readCb();

		return {uid}; 
	}
	
	const {default: compress} = await import(
		/* webpackChunkName: 'afs-sources-worker-compress' */ 
		'./worker-compress.js'
	);

	const compressed = await compress(readCb, file);

	// Update processing tracker ui.
  processedCb();

	return {...compressed, uid};
};


Comlink.expose({process});
