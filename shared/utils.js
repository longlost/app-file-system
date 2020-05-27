
import {blobToFile} from '@longlost/lambda/lambda.js';
import path         from 'path';
import mime         from 'mime-types';


// Returns true if there are no more cloud processes to complete.
// Either processed successfully or failed for all three versions.
const allProcessingRan = item => {

  const {
    optimized,
    optimizedError,
    oriented, 
    orientedError,
    thumbnail, 
    thumbnailError
  } = item;

  const optimizeRan  = optimized || optimizedError;
  const orientRan    = oriented  || orientedError;
  const thumbnailRan = thumbnail || thumbnailError;

  return optimizeRan && orientRan && thumbnailRan;
};


// Pull any src url params from end of extention.
const cleanExt = src => path.extname(src).split('?')[0];

// Create a file from a canvas element's image data.
// Need the original src to get the appropriate contentType.
// Must provide the new file's name.
const canvasFile = (src, name, canvas) => {
  const ext      = cleanExt(src);
  const filename = `${name}${ext}`;
  const type     = mime.contentType(filename);

  const promise = new Promise(resolve => {

    canvas.toBlob(
      blob => {
        resolve(blobToFile(blob, filename, type));
      }, 
      type
    );
  });

  return promise;
};

// 'callback' will be passed an object with the following properties:
//
//    cancel, loaded, progress, total, type
//
// Calling 'cancel' will halt stream and throw an error
// with error.message set to 'Failed to fetch'.
const fetchBlob = async (url, callback, options) => {

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const reader = response.body.getReader();

  // Get total file length.
  const total = response.headers.get('Content-Length');

  // Get file type.
  const contentType = response.headers.get('Content-Type');
  const type        = contentType.split(';')[0];

  // Using stream in order to show a progress bar ui.
  const stream = new ReadableStream({
    start(controller) {

      // Read the data.
      let loaded = 0;
      // Calling cancel will halt stream and throw an error
      // with error.message set to 'Failed to fetch'.
      const cancel = controller.error.bind(controller);

      const pump = async () => {

        const {done, value} = await reader.read();

        // When no more data needs to be consumed, close the stream
        if (done) {
          controller.close();
          return;
        }

        loaded += value.length;

        if (callback) {
          const progress = total ? (loaded / total) * 100 : 100;

          callback({cancel, loaded, progress, total, type});
        }

        // Enqueue the next data chunk into our target stream
        controller.enqueue(value);

        return pump();
      };

      return pump();      
    }
  });

  const streamResponse = await new Response(stream);
  const blob           = await streamResponse.blob();
  const name           = path.basename(url);

  return {blob, name, type};
};

// 'callback' will be passed an object with the following properties:
//
//    cancel, loaded, progress, total, type
//
// Calling 'cancel' will halt stream and throw an error
// with error.message set to what was passed into 'cancel'.
const fetchFile = async (url, callback, options) => {
  
  const {blob, name, type} = await fetchBlob(url, callback, options);

  const file = blobToFile(blob, name, type);

  return file;
};


// Object, String, String --> Promise --> File
// image-filters and image-adjuster output helper function.
const imgFilterFile = async (filter, src, displayName) => {

 const img = new Image();

 const promise = new Promise((resolve, reject) => {
   img.onload = async () => {

     const canvas = filter.apply(img);
     const file   = await canvasFile(src, displayName, canvas); 

     resolve(file);
   };

   img.onerror = reject;
 }); 

 // MUST set crossorigin to allow WebGL to securely load the downloaded image.
 img.crossOrigin = '';
 img.src = src;

 return promise;
};


// Returns true if the image item will
// be post-processed in the cloud.
const isProcessableImg = type => 
  type.includes('image') && 
  (
    type.includes('jpeg') || 
    type.includes('jpg')  || 
    type.includes('png')
  );

// Png/jpeg images and video files are post-processed.
const isCloudProcessable = ({type}) => 
  type && (isProcessableImg(type) || type.includes('video'));


export {
  allProcessingRan,
  fetchBlob,
  fetchFile,
  imgFilterFile,
  isCloudProcessable
};
