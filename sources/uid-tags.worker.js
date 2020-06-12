
// Extract EXIF tags and generate a random hash
// for a file in preparation for display and upload.

// Add this to the project's package.json for a smaller, custom 'exifreader' build.

// "exifreader": {
//   "include": {
//     "exif": [
//       "DateTimeOriginal",   
//       "GPSAltitude",        
//       "GPSAltitudeRef",     
//       "GPSDateStamp",       
//       "GPSImgDirection",    
//       "GPSImgDirectionRef", 
//       "GPSLatitude",        
//       "GPSLatitudeRef",     
//       "GPSLongitude",       
//       "GPSLongitudeRef",    
//       "GPSTimeStamp",       
//       "ImageDescription",   
//       "Orientation"
//     ]
//   }
// },

import * as Comlink from 'comlink';
import ExifReader 	from 'exifreader'; // https://github.com/mattiasw/ExifReader
import {nanoid}			from 'nanoid/non-secure';


const reader = new FileReaderSync();


const getUidAndTags = (file, tagNames) => {	
	const uid = nanoid(); // ie. 'Uakgb_J5m9g-0JDMbcJqLJ'.

	// Don't need file to get a uid issued.
	if (!file) { return {uid}; }

	// Don't run non-supported file types.
	if (
		!file.type.includes('jpg')  &&
    !file.type.includes('jpeg') &&
    !file.type.includes('png')  &&
    !file.type.includes('tiff') &&
    !file.type.includes('webp')
   ) { 
		return {uid}; 
	}

	const buffer = reader.readAsArrayBuffer(file);
	const tags 	 = ExifReader.load(buffer);

	if (Array.isArray(tagNames)) {

		const requestedTags = tagNames.reduce((accum, name) => {

			if (tags[name]) {
				accum[name] = tags[name].value;
			}
			
			return accum;
		}, {Orientation: 1});

		return {tags: requestedTags, uid};
	}

	return {tags, uid};
};


Comlink.expose({getUidAndTags});
