
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
  *
  * See:
  *
  *   https://www.smashingmagazine.com/2015/06/efficient-image-resizing-with-imagemagick/
  *   https://www.imagemagick.org/Usage/resize/
  *
  **/

import magick                        from '@longlost/wasm-imagemagick/wasm-imagemagick.js';
import {canProcess}                  from '@longlost/app-core/img-utils.js';
import {identifyExifStr, formatExif} from './worker-exif.js';


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


const identify = (file, str) => {
  const {name} = file;

  return magick({
    commands:       ['identify', '-quiet', '-ping', '-format', str, name],
    fileCollection: [{file, inputName: name}]
  });
};


// Read exif, width and height properties.
const identifyExifAndDimensions = async file => {

  const exifStr   = identifyExifStr();
  const formatStr = `%h\n%w\n${exifStr}`;

  const [height, width, ...rest] = await identify(file, formatStr);

  const exif = formatExif(rest);

  return {exif, height: Number(height), width: Number(width)};
};


// Read image width and height properties.
const identifyDimensions = async file => {

  const [height, width] = await identify(file, '%h\n%w\n');

  return {height: Number(height), width: Number(width)};
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
const compressor = async (exif, file, size) => {
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

  const dimensions = await identifyDimensions(compressed);

  return {exif, file: compressed, ...dimensions};
};

// The most basic processing regime.
// Strip metadata and orient the 
// image for upright display.
const minimizer = async (exif, file) => {
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

  const dimensions = await identifyDimensions(minimized);

  return {exif, file: minimized, ...dimensions};
};


export default async (callback, file) => {

  if (canProcess(file)) {

    const {exif, height, width} = await identifyExifAndDimensions(file);

    // Update file read ui.
    callback();

    // Small sized images.
    if (height < SMALL_MAX_SIZE && width < SMALL_MAX_SIZE) {

      // Large memory footprint, so compress.
      if (file.size > SMALL_MIN_KB) {
        return compressor(exif, file, 'small');
      }
    }

    // Large sized images.
    if (height < LARGE_MAX_SIZE && width < LARGE_MAX_SIZE) {

      // Large memory footprint, so compress.
      if (file.size > LARGE_MIN_BYTES) {
        return compressor(exif, file, 'large');
      }
    }

    // Huge sized images that have a large memory 
    // footprint and need to be compressed.
    if (file.size > LARGE_MIN_BYTES) {
      return compressor(exif, file, 'huge');
    }

    // Image does not need to be compressed, but still
    // strip metadata and orient upright for display.
    return minimizer(exif, file);
  }

  // Update file read ui.
  callback();

  // Files that are not supported by ImageMagick.
  return {file}; 
};
