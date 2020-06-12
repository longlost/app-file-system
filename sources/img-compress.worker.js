
// Extract EXIF tags and generate a random hash
// for a file in preparation for display and upload.

import * as Comlink from 'comlink';
import Jimp 				from 'jimp';


const IMAGE_QUALITY 	= 80; 	// 0 - 100, 100 is no change in quality. Used for jpeg/bmp/tiff/gif.
const PNG_COMPRESSION = 9;  	// 0 - 9, 0 is no compression. Used for png only.
const MAX_MB 					= 1;  	// Target max file size.
const MAX_SIZE 				= 2048; // Maximum image dimensions.
const MIN_SCALE 	 		= 0.75;	// Reduce large image file dimensions at least this much.


const reader = new FileReaderSync();


const imageCompression = async file => {

  const buffer = reader.readAsArrayBuffer(file);
	const image  = await Jimp.read(buffer);

	const sizeMB = file.size / 1024 / 1024;

	// Aggresively reduce the size of images larger than 1MB.
	// Take twice the inverse of the size in MB.
	// The further a file's size is away from MAX_MB, 
	// the more the image dimensions are reduced.
	if (sizeMB > MAX_MB) {
		const scale = Math.min(2 / sizeMB, MIN_SCALE);

		image.scale(scale);
	}

	// If an image is already less then MAX_MB, then make sure it is
	// smaller than MAX_SIZE in pixels in either dimension.
	else if ((image.bitmap.width > MAX_SIZE) || (image.bitmap.height > MAX_SIZE)) {
		image.scaleToFit(MAX_SIZE, MAX_SIZE);
	}

	const mime = file.type;

	// Maximum filtering and deflating for png's.
	if (mime.includes('png')) {
		image.
			filterType(Jimp.PNG_FILTER_AUTO).
			deflateLevel(PNG_COMPRESSION);
	}
	else {
		image.quality(IMAGE_QUALITY);
	}

	const processedBuffer = await image.getBufferAsync(mime);
	const compressed 			= new File([processedBuffer], file.name, {type: mime});

	// Jimp sometimes increases the size of small files, 
	// so use the original instead.
	const smallest = compressed.size < file.size ? compressed : file;

	return smallest;
};


const compress = file => {

	if (!file) { return; }

	// Only process image files that jimp supports.
	//
	// Jimp docs claim support for gif's but
	// after looking at thier issues page, they
	// say that gif support is sketchy at best, so
	// NOT running gifs at this time (June 12, 2020). 
	if (
		file.type.includes('bmp')  ||
		file.type.includes('jpeg') || 
		file.type.includes('jpg')  || 
		file.type.includes('png')  ||
		file.type.includes('tiff')
	) { 
		return imageCompression(file); 
	}

	return file;
};


Comlink.expose({compress});
