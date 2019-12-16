
// Extract EXIF tags and generate a random hash
// for a file in preparation for display and upload.

import * as Comlink from 'comlink';
import ExifReader 	from 'exifreader';
import nanoid 			from 'nanoid/non-secure';


const reader = new FileReaderSync();


const getUidAndOrientation = (file, tag) => {	
	const uid = nanoid(); //=> 'Uakgb_J5m9g-0JDMbcJqLJ'
	// Don't need file to get a uid issued.
	// Non 'jpg' files don't have orientation metadata.
	if (!file || (!file.type.includes('jpg') && !file.type.includes('jpeg'))) { 
		return {uid}; 
	}

	const buffer = reader.readAsArrayBuffer(file);
	const tags 	 = ExifReader.load(buffer);

	if (tag) {
		return {tag: tags[tag], uid};
	}
	return {tags, uid};
};


Comlink.expose({getUidAndOrientation});
