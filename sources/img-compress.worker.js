
// Extract EXIF tags and generate a random hash
// for a file in preparation for display and upload.

import * as Comlink from 'comlink';
import Jimp 				from 'jimp/es';


const IMAGE_QUALITY 	= 75; // 0 - 100, 100 is no change in quality. Used for jpeg/bmp/tiff/gif.
const PNG_COMPRESSION = 5;  // 0 - 9, 0 is no compression. Used for png only.


const imageCompression = (file, orientation = 0) => {

	const mime 	 = file.type;
  // const width  = (orientation === 6 || orientation === 8) ? Jimp.AUTO : IMAGE_SIZE;
  // const height = (orientation === 6 || orientation === 8) ? IMAGE_SIZE : Jimp.AUTO;

	const reader = new FileReader(); // Jimp does not accept raw files.
  reader.readAsArrayBuffer(file);

  const promise = new Promise((resolve, reject) => {

  	reader.onload = async () => {

  		if (reader.error) {
  			reject(reader.error);
  		}

  		try {

	  		const image = await Jimp.read(reader.result);

	  		// image.resize(width, height).quality(IMAGE_QUALITY);

	  		if (mime.includes('png')) {
	  			image.deflateLevel(PNG_COMPRESSION); // 0 - 9, 0 is no compression.
	  		}
	  		else {
	  			image.quality(IMAGE_QUALITY);
	  		}


	  		const buffer = await image.getBufferAsync(mime);

	  		// TODO:
	  		// 			Check if File is available on iOS Safari, it wasn't 3 years ago.

	  		const compressed = new File([buffer], file.name, {type: mime});

	  		resolve(compressed);


	  		

	    	// const blob = new Blob([buffer], {type: mime});

	    	// resolve(blob);
  		}
  		catch (error) {
  			reject(error);
  		}  			
    };

    reader.onerror = reject;

  });

	return promise;
};


const compress = (file, orientation) => {

	if (!file) { return; }

	// Only process image files that jimp supports.
	if (
		file.type.includes('bmp')  ||
		file.type.includes('gif')  || 
		file.type.includes('jpeg') || 
		file.type.includes('jpg')  || 
		file.type.includes('png')  ||
		file.type.includes('tiff')
	) { 
		return imageCompression(file, orientation); 
	}

	return file;
};


Comlink.expose({compress});
