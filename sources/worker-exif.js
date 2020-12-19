
// Extract EXIF data from images.


const EXIF_TAGS = [
  'DateTimeOriginal',   // Date and time string when image was originally created.
  'GPSAltitude',        // Meters.
  'GPSAltitudeRef',     // '0' - above sea level, '1' - below sea level.
  'GPSDateStamp',       // UTC. 'YYYY:MM:DD'.
  'GPSImgDirection',    // 'T' true north, or 'M' for magnetic north.
  'GPSImgDirectionRef', // 0 - 359.99, degrees of rotation from north.
  'GPSLatitude',        // Degrees, minutes, and seconds (ie. With secs - dd/1,mm/1,ss/1, or without secs dd/1,mmmm/100,0/1).
  'GPSLatitudeRef',     // 'N' for north latitudes, 'S' for south latitudes.
  'GPSLongitude',       // Degrees, minutes, and seconds (ie. With secs - dd/1,mm/1,ss/1, or without secs dd/1,mmmm/100,0/1).
  'GPSLongitudeRef',    // 'E' for east longitudes, 'W' for west longitudes.
  'GPSTimeStamp',       // UTC. hour, minute, sec.
  'ImageDescription',   // User generated string for image (ie. 'Company picnic').
  'Orientation',        // One of 8 values, most common are 1, 3, 6 and 8 since other are 'flipped' versions.
  'Make',
  'Model'
];


// Format GPS Lat and Long entries.
const formatGps = (tag, value) => {

	if (value && (tag === 'GPSLatitude' || tag === 'GPSLongitude')) {
		const entries = value.split(',');
		
		return entries.map(entry => {
			
			const [numerator, denominator] = entry.
																				 trim().
																				 split('/').
																				 map(str => Number(str));

			return denominator === 0 ? numerator : numerator / denominator;
		});
	}

	return value;
};

// Build a string suitable for IM 'identify' 
// that only includes the custom tags.
const identifyExifStr = () => EXIF_TAGS.reduce((accum, tag) => 
																`${accum}%[EXIF:${tag}]\n`, '');

// Format the ImageMagic array of string values into
// a more useful object with exif tag names as keys.
const formatExif = array => {

	if (!array || !array.length || array.length !== EXIF_TAGS.length) { return; }

	const exif = EXIF_TAGS.reduce((accum, tag, index) => {

		const value = array[index];

		if (!value) { return accum; }

		accum[tag] = formatGps(tag, value);

		return accum;
	}, {});

	if (Object.keys(exif).length === 0) { return; }

	return exif;
};


export {identifyExifStr, formatExif};
