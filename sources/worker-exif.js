
// Extract EXIF data from images.

// https://github.com/mattiasw/ExifReader
import ExifReader from '@longlost/afs-custom-exifreader/exif-reader.js'; 


// Flatten single entry arrays.
// Flatten GPS 2d arrays.
const format = (name, value) => {

	if (Array.isArray(value)) {

		if (value.length === 1 || name === 'GPSAltitude' || name === 'GPSImgDirection') {
			return value[0];
		}

		// 'Value' is a 2D Array.
		if (Array.isArray(value[0])) {

			if (name.startsWith('GPS')) {

				return value.map(entries => {
					const [numerator, denominator] = entries;

					return denominator === 0 ? numerator : numerator / denominator;
				});
			}

			return value.flat();
		}
	}

	// Value is a single Number or String.
	return value;
};


export default (file, exifTags) => {	
	const reader = new FileReaderSync();
	const buffer = reader.readAsArrayBuffer(file);
	const exif 	 = ExifReader.load(buffer);

	if (Array.isArray(exifTags)) {

		const requestedTags = exifTags.reduce((accum, name) => {

			if (exif[name]) {
				const {value} = exif[name];

				accum[name] = format(name, value);
			}
			
			return accum;
		}, {Orientation: 1});


		return requestedTags;
	}

	return exif;
};
