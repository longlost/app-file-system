
import {canvasToFile} from '@longlost/app-core/img-utils.js';


// Object, String, String --> Promise --> File
// image-filters and image-adjuster output helper function.
const imgFilterFile = async (filter, src, displayName, ext) => {

  const img = new Image();

  const promise = new Promise((resolve, reject) => {
    img.onload = async () => {

      const canvas = filter.apply(img);      
      const file   = await canvasToFile(displayName, ext, canvas); 

      resolve(file);
    };

    img.onerror = reject;
  }); 

  // MUST set crossorigin to allow WebGL to securely load the downloaded image.
  img.crossOrigin = 'anonymous';
  img.src         = src;

  return promise;
};


export {imgFilterFile};
