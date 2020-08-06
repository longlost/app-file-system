

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

import * as Comlink  from 'comlink';
import * as imgUtils from '../shared/img-utils.js';
import {nanoid}			 from 'nanoid/non-secure'; // https://github.com/ai/nanoid


const process = async (callback, file, exifTags) => {	
	const uid = nanoid(); // ie. 'Uakgb_J5m9g-0JDMbcJqLJ'.

	// The file may not be passed since there is
	// no need to transfer a file accross contexts 
	// just to get a uid issued if it cannot be processed.
	// Don't process unsupported file types either.
	if (!file || !imgUtils.canProcess(file)) {
	 
		// Update file read ui.
		callback();

		return {uid}; 
	}

	// Firebase does not allow undefined values.
	let exif = null;

	if (imgUtils.canReadExif(file)) {
		const {default: read} = await import('./worker-exif.js');

		exif = read(file, exifTags);
	}

	if (imgUtils.canProcess(file)) {
		const {default: compress} = await import('./worker-compress.js');
		const compressed 					= await compress(callback, file);

		return {exif, file: compressed, uid};
	}

	// Update file read ui.
	callback();

	return {exif, uid};
};


Comlink.expose({process});
