
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


const KILOBYTE = 1024;

const HUGE_QUALITY       = '85';  // 0 - 100, 100 is no change in quality.
const HUGE_RESIZE_FACTOR = '60%'; // Not recommended to be lower than 50%.
const HUGE_UNSHARP       = '0x0.75+0.75+0.008';

const LARGE_MAX_SIZE      = 1024; // Dimensions smaller than this are considered 'large'.
const LARGE_TARGET_KB     = 500;  // Ideal max file size.
const LARGE_MIN_BYTES     = KILOBYTE * LARGE_TARGET_KB; // Memory footprint.
const LARGE_QUALITY       = '88';  // 0 - 100, 100 is no change in quality.
const LARGE_RESIZE_FACTOR = '80%'; // Not recommended to be lower than 50%.
const LARGE_UNSHARP       = '0x0.75+0.75+0.008';

const SMALL_MAX_SIZE      = 512;            // Dimensions smaller than this are considered 'small'.
const SMALL_MIN_KB        = KILOBYTE * 100; // Memory footprint.
const SMALL_QUALITY       = '90';           // 0 - 100, 100 is no change in quality.
const SMALL_RESIZE_FACTOR = '85%';          // Not recommended to be lower than 50%.
const SMALL_UNSHARP       = '0x6+0.5+0';


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


const getSizeSpecificCommands = (type, size) => {
  if (type.includes('png')) {
    if (size === 'huge') {
      return [
        '-adaptive-resize', HUGE_RESIZE_FACTOR, 
        '-unsharp',         HUGE_UNSHARP,
        '-quantize',       'transparent',                // Do not index the alpha channel.
        '-colors',         '255',                        // Index color palette to 255 max colors plus the alpha.
        '-define',         'png:compression-filter=5',   // Adaptive filtering.
        '-define',         'png:compression-level=9',    // 0-9 - Usage level of available cpu/mem resources.
        '-define',         'png:compression-strategy=1', // Default strat.
        '-define',         'png:exclude-chunk=all'       // Remove PNG specific metadata.
      ]; 
    }

    if (size === 'large') {
      return [
        '-adaptive-resize', LARGE_RESIZE_FACTOR,
        '-unsharp',         LARGE_UNSHARP,
        '-quantize',       'transparent',                // Do not index the alpha channel.
        '-colors',         '255',                        // Index color palette to 255 max colors plus the alpha.
        '-define',         'png:compression-filter=5',   // Adaptive filtering.
        '-define',         'png:compression-level=7',    // 0-9 - Usage level of available cpu/mem resources.
        '-define',         'png:compression-strategy=1', // Default strat.
        '-define',         'png:exclude-chunk=all'       // Remove PNG specific metadata.
      ]; 
    }

    return [
      '-adaptive-resize', SMALL_RESIZE_FACTOR, 
      '-unsharp',         SMALL_UNSHARP,
      '-quantize',       'transparent',                // Do not index the alpha channel.
      '-colors',         '255',                        // Index color palette to 255 max colors plus the alpha.
      '-define',         'png:compression-filter=5',   // Adaptive filtering.
      '-define',         'png:compression-level=5',    // 0-9 - Usage level of available cpu/mem resources.
      '-define',         'png:compression-strategy=1', // Default strat.
      '-define',         'png:exclude-chunk=all'       // Remove PNG specific metadata.
    ]; 
  }

  // JPEG.

  if (size === 'huge') {
    return [
      '-adaptive-resize', HUGE_RESIZE_FACTOR, 
      '-quality',         HUGE_QUALITY, 
      '-unsharp',         HUGE_UNSHARP,
      '-define',         'jpeg:fancy-upsampling=off', // When on, adds to file size without noticable improvement.
      '-define',         `jpeg:extent=${LARGE_TARGET_KB}kb` // Target file size.
    ]; 
  }

  if (size === 'large') {
    return [
      '-adaptive-resize', LARGE_RESIZE_FACTOR, 
      '-quality',         LARGE_QUALITY, 
      '-unsharp',         LARGE_UNSHARP,      
      '-define',         'jpeg:fancy-upsampling=off', // When on, adds to file size without noticable improvement.
      '-define',         `jpeg:extent=${LARGE_TARGET_KB}kb` // Target file size.
    ]; 
  }

  return [
    '-adaptive-resize', SMALL_RESIZE_FACTOR, 
    '-quality',         SMALL_QUALITY, 
    '-unsharp',         SMALL_UNSHARP,
    '-define',         'jpeg:fancy-upsampling=off' // When on, adds to file size without noticable improvement.
  ]; 
};

// Best effort to balance reducing file size 
// without greatly sacrificing quality.
const compressor = async (file, size) => {
  const {name, type} = file;

  const commands  = [
    'mogrify', 
    '-auto-orient',              // Orient image for upright viewing.
    '-sampling-factor', '4:2:0', // Google recommended for web.
    ...getSizeSpecificCommands(type, size),
    '-interlace',  'none', // No progressive rendered images.
    '-colorspace', 'sRGB', // W3C endorced color space for the web.
    '-strip',              // Remove metadata.
    name
  ]; 

  const compressed = await magick({
    commands,
    fileCollection: [{file, inputName: name}], 
    outputName:     name,
    outputType:     type
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



// // TESTING ONLY!!
// //
// // 482KB input
// // 458KB no options passthrough
// // 236KB ONLY -resize to 512px
// // 654KB ONLY -adaptive-resize 60%
// // 471KB all options EXCEPT a resize
// // 183KB with all options AND -adaptive 60%
// // 88KB  with all options AND -resize 512px
// // 336KB with all options AND -resize 1024px
// // 176KB with all options AND -resize 60%
// const optimTest = async (file, size) => {
//   const {name, type} = file;

//   const OPTIM_MAX_SIZE = 1024;
//   const OPTIM_TARGET_KB = 100;
//   const THUMB_MAX_SIZE = 256;

//   const commands  = [
//     'mogrify', 



//     '-auto-orient', // Places image upright for viewing.
//     '-filter',          'Triangle',
//     '-define',          'filter:support=2',



//     // '-resize',     `${OPTIM_MAX_SIZE}x${OPTIM_MAX_SIZE}>`,

//     '-resize', '50%',

//     // '-adaptive-resize', '60%',     


//     '-quantize',        'transparent',
//     '-colors',          '255',
//     '-unsharp',         '0.25x0.25+8+0.065',
//     '-quality',         '82',
//     '-define',          'jpeg:fancy-upsampling=off',
//     '-define',          `jpeg:extent=${OPTIM_TARGET_KB}kb`,
//     '-define',          'png:compression-filter=5',
//     '-define',          'png:compression-level=9',
//     '-define',          'png:compression-strategy=1',
//     '-define',          'png:exclude-chunk=all',
//     '-interlace',       'none',
//     '-colorspace',      'sRGB',
//     '-strip', // Removes all metadata.
//     name
//   ]; 


//   // const commands  = [
//   //   'mogrify', 
//   //   '-auto-orient', // Places image upright for viewing.
//   //   '-thumbnail', `${THUMB_MAX_SIZE}x${THUMB_MAX_SIZE}>`,
//   //   '-quantize',  'transparent',
//   //   '-colors',    '255',
//   //   '-strip', // Removes all metadata.
//   //   name
//   // ]; 


  



//   const compressed = await magick({
//     commands,
//     fileCollection: [{file, inputName: name}], 
//     outputName:     name,
//     outputType:     type
//   });

//   return compressed;
// };




export default async (callback, file) => {

  if (imgUtils.canProcess(file)) {

    const info            = await identifier(file);
    const {height, width} = getImageSize(info);

    // Update file read ui.
    callback();

    // Small sized images.
    if (height < SMALL_MAX_SIZE && width < SMALL_MAX_SIZE) {

      // Large memory footprint, so compress.
      if (file.size > SMALL_MIN_KB) {
        return compressor(file, 'small');
      }
    }

    // Large sized images.
    if (height < LARGE_MAX_SIZE && width < LARGE_MAX_SIZE) {

      // Large memory footprint, so compress.
      if (file.size > LARGE_MIN_BYTES) {
        return compressor(file, 'large');
      }
    }

    // Huge sized images that have a large memory 
    // footprint and need to be compressed.
    if (file.size > LARGE_MIN_BYTES) {
      return compressor(file, 'huge');
    }




    // TESTING ONLY!!!!
    //
    // if (file.size > LARGE_MIN_BYTES) {
    //   const compressed = await compressor(file, 'huge');

    //   console.log('first pass: ', compressed.size);

    //   return optimTest(compressed, 'huge');
    // }




    // Image does not need to be compressed, but still
    // strip metadata and orient upright for display.
    return minimizer(file);
  }

  // Update file read ui.
  callback();

  // Files that are not supported by ImageMagick.
  return file; 
};
