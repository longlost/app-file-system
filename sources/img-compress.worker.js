
/**
	* Use ImageMagick to process images in an 
	* attempt to reduce the size of the file
	* without loosing too much quality.
	*
	* This on-device processing is especially necessary
	* due to the low memory of mobile devices, which can
	* be exceeded when live editing large image files (> 1MB)
	* in the `image-editor`.
	*
	* Though doing so trades off battery life, it reduces
	* upload times, and data usage for each user. This is 
	* also good for app owners as it eliminates the utilization 
	* of 1 of 3 image processing cloud functions.
	*
	**/

import * as Comlink from 'comlink';
import magick       from '@longlost/wasm-imagemagick/wasm-imagemagick.js';


const IMAGE_QUALITY = '82';  // 0 - 100, 100 is no change in quality.
const RESIZE_FACTOR = '60%'; // Not recommended to be lower than 50%.


const compressor = async file => {

  const inputName  = `input_${file.name}`;
  const outputName = file.name;

  const commands  = [
    'convert', 
    inputName,
    '-auto-orient',
    '-sampling-factor', '4:2:0',
    '-strip', 
    '-auto-gamma', 
    '-adaptive-resize', RESIZE_FACTOR, 
    '-quality', 				IMAGE_QUALITY, 
    '-unsharp', 			 '0x0.75+0.75+0.008', 
    outputName
  ];

  const compressed = await magick([{file, inputName}], outputName, commands);

  return compressed;
};


const compress = file => {

	if (!file) { return; }

	// Only process image files that ImageMagick supports.


	// TODO:
	//
	// 			Update this for new ImageMagick library.


	if (
		file.type.includes('bmp')  ||
		file.type.includes('jpeg') || 
		file.type.includes('jpg')  || 
		file.type.includes('png')  ||
		file.type.includes('tiff')
	) { 
		return compressor(file); 
	}

	return file;
};


Comlink.expose({compress});
