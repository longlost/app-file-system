
// Extract EXIF tags.

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

import ExifReader from 'exifreader'; // https://github.com/mattiasw/ExifReader


export default (file, exifTags) => {	
	const reader = new FileReaderSync();
	const buffer = reader.readAsArrayBuffer(file);
	const exif 	 = ExifReader.load(buffer);

	if (Array.isArray(exifTags)) {

		const requestedTags = exifTags.reduce((accum, name) => {

			if (exif[name]) {
				accum[name] = exif[name].value;
			}
			
			return accum;
		}, {Orientation: 1});

		return requestedTags;
	}

	return exif;
};
