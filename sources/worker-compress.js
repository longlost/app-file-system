
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

import magick        from '@longlost/wasm-imagemagick/wasm-imagemagick.js';
import * as imgUtils from '../shared/img-utils.js';


const KILOBYTE           = 1024;
const IMG_SIZE_THRESHOLD = 512; // Images with at lease one dimension larger than this are considered 'large'.

const LARGE_IMG_MIN_KB        = KILOBYTE * 500; // Process 'large' imgs with a memory footprint greater than this.
const LARGE_IMG_QUALITY       = '82';           // 0 - 100, 100 is no change in quality.
const LARGE_IMG_RESIZE_FACTOR = '60%';          // Not recommended to be lower than 50%.
const LARGE_IMG_UNSHARP       = '0x0.75+0.75+0.008';

const SMALL_IMG_MIN_KB        = KILOBYTE * 100; // Process 'small' imgs with a memory footprint greater than this.
const SMALL_IMG_QUALITY       = '85';           // 0 - 100, 100 is no change in quality.
const SMALL_IMG_RESIZE_FACTOR = '70%';          // Not recommended to be lower than 50%.
const SMALL_IMG_UNSHARP       = '0x6+0.5+0';


// Read basic image properties.
const identifier = async file => {
  const {name} = file;

  const [info] = await magick({
    commands:       ['identify', name],
    fileCollection: [{file, inputName: name}]
  });

  return info;
};

// The argument is a string with the following format:
//    Filename[frame #] image-format widthxheight page-widthxpage-height+x-offset+y-offset 
//    colorspace user-time elapsed-time
const getImageSize = str => {
  const sizeStr         = str.split(' ')[2];
  const [width, height] = sizeStr.split('x');

  return {height, width};
};


const getSizeSpecificCommands = size => {
  if (size === 'large') {
    return [
      '-adaptive-resize', LARGE_IMG_RESIZE_FACTOR, 
      '-quality',         LARGE_IMG_QUALITY, 
      '-unsharp',         LARGE_IMG_UNSHARP
    ]; 
  }

  return [
    '-adaptive-resize', SMALL_IMG_RESIZE_FACTOR, 
    '-quality',         SMALL_IMG_QUALITY, 
    '-unsharp',         SMALL_IMG_UNSHARP
  ]; 
};

// Best effort to balance reducing file size 
// without greatly sacrificing quality.
const compressor = async (file, size) => {
  const {name} = file;

  const commands  = [
    'mogrify', 
    '-auto-orient',
    '-strip', 
    '-sampling-factor', '4:2:0',
    '-auto-gamma', 
    ...getSizeSpecificCommands(size),
    name
  ]; 

  const compressed = await magick({
    commands,
    fileCollection: [{file, inputName: name}], 
    outputName:     name,
    outputType:     file.type
  });

  return compressed;
};

// The most basic processing regime.
// Strip metadata and orient the 
// image for upright display.
const minimizer = async file => {
  const {name} = file;

  const commands  = [
    'mogrify', 
    '-auto-orient',
    '-strip',
    name
  ]; 

  const minimized = await magick({
    commands,
    fileCollection: [{file, inputName: name}], 
    outputName:     name,
    outputType:     file.type
  });

  return minimized;
};


export default async file => {

  if (imgUtils.canProcess(file)) {

    const info            = await identifier(file);
    const {height, width} = getImageSize(info);

    // Small sized images.
    if (height < IMG_SIZE_THRESHOLD && width < IMG_SIZE_THRESHOLD) {

      // Large memory footprint, so compress.
      if (file.size > LARGE_IMG_MIN_KB) {
        return compressor(file, 'small');
      }
    }

    // Large sized images that have a large memory 
    // footprint and need to be compressed.
    if (file.size > LARGE_IMG_MIN_KB) {
      return compressor(file, 'large');
    }

    // Image does not need to be compressed, but still
    // strip metadata and orient upright for display.
    return minimizer(file);
  } 

  // Files that are not supported by ImageMagick.
  return file; 
};
