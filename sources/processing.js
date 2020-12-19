

import path         from 'path'; // webpack includes this by default!
import * as Comlink from 'comlink';
import {canProcess} from '@longlost/app-core/img-utils.js';
import runner       from '@longlost/app-core/worker/runner.js';

const KILOBYTE = 1024;
const MEGABYTE = 1048576;

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

export default async (files, readCallback, processedCallback) => {

  if (!processRunner) {

    const {default: Worker} = await import(
      /* webpackChunkName: 'app-file-system-processing-worker' */ 
      './processing.worker.js'
    );

    processRunner = await runner(Worker).run;
  }

  const proxiedReadCb      = Comlink.proxy(readCallback);
  const proxiedProcessedCb = Comlink.proxy(processedCallback);
  const baseArgs           = ['process', proxiedReadCb, proxiedProcessedCb];

  const processPromises = files.map(file => {
    const process = async () => {


      // // TESTING!!    
      // console.log(file.name, ' original size: ', formatFileSize(file.size));
      // const start = Date.now();


      // No need to transfer file accross contexts if it won't be processed.
      const processed = canProcess(file) ? 
                          await processRunner(...baseArgs, file) :
                          await processRunner(...baseArgs);

      processed.file = processed.file || file;


      // // TESTING ONLY!!
      // const end = Date.now();
      // const secs = (end - start) / 1000;
      // console.log(`${file.name}  processed size: ${formatFileSize(processed.file.size)} took ${secs} sec`);
      

      return processed;
    };

    return process();
  });

  const processedItems = await Promise.all(processPromises);

  return processedItems.map((item, index) => {

    // Set entries that are not always present to null 
    // because Firestore does not accept undefined vals;
    const {
      exif = null, 
      file, 
      height = null, 
      uid, 
      width = null
    } = item;

    if (file.type.includes('image') || file.type.includes('video')) { 
      file._tempUrl = window.URL.createObjectURL(file);
    }
    else {
      file._tempUrl = null; // Firestore does not accept undefined vals;
    }
  
    file.basename  = file.name;
    file.category  = path.dirname(file.type);
    file.exif      = exif;
    file.ext       = path.extname(file.name);
    file.height    = height;
    file.index     = index;
    file.sizeStr   = formatFileSize(file.size);
    file.timestamp = Date.now();
    file.uid       = uid;
    file.width     = width;

    return file;
  });
};
