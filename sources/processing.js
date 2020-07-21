

import path   from 'path'; // webpack includes this by default!
import runner from '@longlost/worker/runner.js';


const KILOBYTE = 1024;
const MEGABYTE = 1048576;

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
  'Orientation'         // One of 8 values, most common are 1, 3, 6 and 8 since other are 'flipped' versions.
];

// Create a human-readable file size display string.
const formatFileSize = size => {

  if (size < KILOBYTE) {
    return `${size}bytes`;
  }

  if (size >= KILOBYTE && size < MEGABYTE) {
    return `${Number((size / KILOBYTE).toFixed(1))}KB`;
  } 

  if (size >= MEGABYTE) {
    return `${Number((size / MEGABYTE).toFixed(1))}MB`;
  }
};


let processRunner;

export default async (files, callback) => {

  if (!processRunner) {

    const {default: Worker} = await import(
      /* webpackChunkName: 'app-file-system-processing-worker' */ 
      './processing.worker.js'
    );

    processRunner = await runner(Worker);
  }


  const processPromises = files.map(file => {

    
    console.log('original size: ', formatFileSize(file.size));



    const process = async () => {


      // TESTING!!
      const start = Date.now();


      const processed = await processRunner('process', file, EXIF_TAGS);



      // TESTING ONLY!!
      const end = Date.now();
      const secs = (end - start) / 1000;
      console.log(`${file.name} took ${secs} sec`);



      // Update processing tracker ui.
      callback();

      return processed;
    };

    return process();
  });

  const processedItems = await Promise.all(processPromises);

  return processedItems.map((item, index) => {
    const {exif, file, uid} = item;



    console.log('compressed size: ', formatFileSize(file.size));

    console.log('file: ', file);



    if (file.type.includes('image') || file.type.includes('video')) { 
      file._tempUrl = window.URL.createObjectURL(file);
    }
    else {
      file._tempUrl = null; // Firestore does not accept undefined vals;
    }
  
    file.basename  = file.name;
    file.category  = path.dirname(file.type);
    file.exif      = exif ? exif : null; // Firestore does not accept undefined vals;
    file.ext       = path.extname(file.name);
    file.index     = index;
    file.sizeStr   = formatFileSize(file.size);
    file.timestamp = Date.now();
    file.uid       = uid;

    return file;
  });
};
