
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

import magick 			 from '@longlost/wasm-imagemagick/wasm-imagemagick.js';
import * as imgUtils from '../shared/img-utils.js';


const IMAGE_QUALITY = '82';  // 0 - 100, 100 is no change in quality.
const RESIZE_FACTOR = '60%'; // Not recommended to be lower than 50%.


const compressor = async file => {

  const inputName  = `input_${file.name}`;
  const outputName = file.name;

  const commands  = [
    'convert', 
    inputName,
    '-auto-orient',
    '-strip', 
    '-sampling-factor', '4:2:0',
    '-auto-gamma', 
    '-adaptive-resize', RESIZE_FACTOR, 
    '-quality', 				IMAGE_QUALITY, 
    '-unsharp', 			 '0x0.75+0.75+0.008', 
    outputName
  ];

  const compressed = await magick({
  	commands,
  	fileCollection: [{file, inputName}], 
  	outputName,
  	outputType: file.type
  });

  return compressed;
};


export default file => {

	if (imgUtils.canProcess(file)) { 
		return compressor(file); 
	}

	return Promise.resolve(file);
};
