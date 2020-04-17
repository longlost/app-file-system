'use strict';


const os     = require('os');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const mkdirp = require('mkdirp-promise');
const spawn  = require('child-process-promise').spawn;


const OPTIM_MAX_WIDTH = 1024;
const THUMB_MAX_WIDTH = 256;
const OPTIM_PREFIX    = 'optim_';
const SHARE_PREFIX    = 'share_';
const THUMB_PREFIX    = 'thumb_';


const isOptimizable = type => 
  type.startsWith('image/') && 
  (type.includes('jpeg') || type.includes('jpg') || type.includes('png'));


const getRandomFileName = ext => `${crypto.randomBytes(20).toString('hex')}${ext}`;
const getTempLocalFile  = name => path.join(os.tmpdir(), name);
const getNewFilePath    = (dir, prefix, name) => 
                            path.normalize(path.join(dir, `${prefix}${name}`));


// Get a download url.
const getUrl = async (bucket, toFilePath) => {
  const f    = bucket.file(toFilePath);
  const meta = await f.getMetadata();
  return meta[0].mediaLink;
};


const getCollAndDoc = dir => {
  const segments = dir.split('/');
  const coll     = path.join(...segments.slice(0, segments.length - 1));
  const doc      = segments[segments.length - 1];
  return {coll, doc};
};


const processImg = (type, prefix, options) => async object => {
  try {

    const {
      contentType,
      metageneration,
      metadata,
      name: filePath,
      size
    } = object;

    // Exit if this is triggered on a file that is not a jpeg or png image.
    if (!isOptimizable(contentType)) {
      console.log('This file is not a jpeg or png image. Not optimizing.');
      return null;
    }

    // Exit if the image is already oriented.
    if (metadata && (metadata['oriented'] || metadata['optimized'] || metadata['thumbnail'])) {
      console.log('Exiting. Already processed.');
      return null;
    }

    const fileDir  = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const fileExt  = path.extname(filePath);

    // Exit if the image is already a thumbnail.
    if (fileName.startsWith(THUMB_PREFIX)) {
      console.log('Exiting. Already a thumbnail.');
      return null;
    }

    // Exit if the image is already already optimized.
    if (fileName.startsWith(OPTIM_PREFIX)) {
      console.log('Exiting. Already an optimized version.');
      return null;
    }

    // Create random filenames with same extension as uploaded file.
    const randomFileName       = getRandomFileName(fileExt);
    const randomFileName2      = getRandomFileName(fileExt);
    const tempLocalFile        = getTempLocalFile(randomFileName);
    const tempLocalDir         = path.dirname(tempLocalFile);
    const tempLocalConvertFile = getTempLocalFile(randomFileName2); 
    const newPath              = getNewFilePath(fileDir, prefix, fileName);
    const bucket               = admin.storage().bucket(object.bucket);
    const fileRef              = bucket.file(filePath);

    // Create the temp directory where the storage file will be downloaded.
    await mkdirp(tempLocalDir);

    // Download file from bucket.
    await fileRef.download({destination: tempLocalFile}); 

    // Convert the image using ImageMagick.
    await spawn('convert', [
      tempLocalFile,
      ...options,
      tempLocalConvertFile
    ]);
    
    const newMetadata = {

      // Setting new contentDisposition here has no effect.
      // Can only be done on client with Storage SDK.
      metadata: {
        [type]:         'true',
        'originalSize': `${size}`,
        'uid':           metadata.uid
      }
    };

    // Upload new processed image. Replaces original version.
    await bucket.upload(tempLocalConvertFile, {
      destination:    newPath, 
      predefinedAcl: 'publicRead', 
      metadata:       newMetadata
    });

    // Delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile); 
    fs.unlinkSync(tempLocalConvertFile);

    if (type === 'oriented') {

      // Allow the oriented version to be downloaded publicly.
      await bucket.file(newPath).makePublic();   
    }

    const {coll, doc} = getCollAndDoc(fileDir); 

    const url = await getUrl(bucket, newPath); 

    const download = {[type]: url};
   
    const data = type === 'optimized' ? 
      Object.assign({sharePath: newPath}, download) :  // Used to get a shareable link.
      download;

    // Add oriented data to existing firestore doc.
    await admin.firestore().collection(coll).doc(doc).set(
      data, 
      {merge: true}
    );

    return null;
  }
  catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('unknown', `image ${type} error`, error);
  }
};




exports.init = (admin, functions) => {

  // After an image is uploaded to the 
  // Storage bucket:
  //
  // 1. Make it publicly downloadable.
  //
  // 2. Create an optimized version.
  //
  // 3. Create a thumbnail version.
  //
  // 4. Save the public download urls for 
  //    new versions into Firestore.
  //
  //
  // Uses ImageMagick to process images.
  //
  // Dynamically merges the url data into 
  // the appropriate coll, doc.





  // const optimize = functions.
  //   runWith({timeoutSeconds: 300}). // Extended runtime of 5 min. for large files (default 60 sec).
  //   storage.
  //   object().
  //   onFinalize(async object => {
  //     try {

  //       const {
  //         contentType,
  //         metageneration,
  //         metadata,
  //         name: filePath,
  //         size
  //       } = object;

  //       // Exit if this is triggered on a file that is not a jpeg or png image.
  //       if (!isOptimizable(contentType)) {
  //         console.log('This file is not a jpeg or png image. Not optimizing.');
  //         return null;
  //       }

  //       // Exit if the image is already processed.
  //       if ((metadata && metadata.processed) || metageneration > 1) {
  //         console.log('Exiting. Already processed.');
  //         return null;
  //       }

  //       const fileDir  = path.dirname(filePath);
  //       const fileName = path.basename(filePath);
  //       const fileExt  = path.extname(filePath);

  //       // Exit if the image is already a thumbnail.
  //       if (fileName.startsWith(THUMB_PREFIX)) {
  //         console.log('Exiting. Already a thumbnail.');
  //         return null;
  //       }

  //       // Exit if the image is already already optimized.
  //       if (fileName.startsWith(OPTIM_PREFIX)) {
  //         console.log('Exiting. Already an optimized version.');
  //         return null;
  //       }

  //       // Create random filenames with same extension as uploaded file.
  //       const randomFileName     = getRandomFileName(fileExt);
  //       const randomFileName2    = getRandomFileName(fileExt);
  //       const randomFileName3    = getRandomFileName(fileExt);
  //       const tempLocalFile      = getTempLocalFile(randomFileName);
  //       const tempLocalDir       = path.dirname(tempLocalFile);
  //       const tempLocalOptimFile = getTempLocalFile(randomFileName2);    
  //       const tempLocalThumbFile = getTempLocalFile(randomFileName3);
  //       const optimPath          = getNewFilePath(fileDir, OPTIM_PREFIX, fileName);
  //       const thumbPath          = getNewFilePath(fileDir, THUMB_PREFIX, fileName);
  //       const bucket             = admin.storage().bucket(object.bucket);
  //       const fileRef            = bucket.file(filePath);

  //       // Create the temp directory where the storage file will be downloaded.
  //       await mkdirp(tempLocalDir);

  //       // Allow the original to be downloaded publicly.
  //       await fileRef.makePublic();

  //       // Download file from bucket.
  //       await fileRef.download({destination: tempLocalFile}); 

  //       // Best attempt at a happy medium of size/quality.
  //       const optimOptions = [
  //         tempLocalFile,
  //         '-auto-orient',
  //         '-filter',     'Triangle',
  //         '-define',     'filter:support=2',
  //         '-resize',     `${OPTIM_MAX_WIDTH}>`, // Keeps original aspect ratio.
  //         '-unsharp',    '0.25x0.25+8+0.065',
  //         '-dither',     'None',
  //         '-posterize',  '136',
  //         '-quality',    '82',
  //         '-define',     'jpeg:fancy-upsampling=off',
  //         '-define',     'png:compression-filter=5',
  //         '-define',     'png:compression-level=9',
  //         '-define',     'png:compression-strategy=1',
  //         '-define',     'png:exclude-chunk=all',
  //         '-interlace',  'none',
  //         '-colorspace', 'sRGB',
  //         '-strip',
  //         tempLocalOptimFile
  //       ];

  //       const thumbOptions = [
  //         tempLocalFile,
  //         '-auto-orient',
  //         '-thumbnail', 
  //         `${THUMB_MAX_WIDTH}>`, // Keeps original aspect ratio.
  //         tempLocalThumbFile
  //       ];

  //       // Convert the image using ImageMagick.
  //       await Promise.all([
  //         spawn('convert', optimOptions), 
  //         spawn('convert', thumbOptions)
  //       ]);
        
  //       const newMetadata = {
  //         // Setting new contentDisposition here has no effect.
  //         // Can only be done on client with Storage SDK.
  //         metadata: {
  //           'processed':    'true',
  //           'originalSize': `${size}`,
  //           'uid':           metadata.uid
  //         }
  //       };

  //       // Upload new images.
  //       await Promise.all([
  //         bucket.upload(tempLocalOptimFile, {
  //           destination:    optimPath, 
  //           predefinedAcl: 'publicRead', 
  //           metadata:       newMetadata
  //         }),
  //         bucket.upload(tempLocalThumbFile, {
  //           destination:    thumbPath, 
  //           predefinedAcl: 'publicRead', 
  //           metadata:       newMetadata
  //         })
  //       ]);

  //       // Delete the local files to free up disk space.
  //       fs.unlinkSync(tempLocalFile); 
  //       fs.unlinkSync(tempLocalOptimFile);
  //       fs.unlinkSync(tempLocalThumbFile);

  //       // Get a download url.
  //       const getUrl = async toFilePath => {
  //         const f    = bucket.file(toFilePath);
  //         const meta = await f.getMetadata();
  //         return meta[0].mediaLink;
  //       };

  //       const [optimized, thumbnail] = 
  //         await Promise.all([getUrl(optimPath), getUrl(thumbPath)]); 

  //       const {coll, doc} = getCollAndDoc(fileDir);

  //       // Add optimize data to existing firestore doc.
  //       await admin.firestore().collection(coll).doc(doc).set(
  //         {
  //           optimized,
  //           sharePath: optimPath, // Used to get a shareable link.
  //           thumbnail
  //         }, 
  //         {merge: true}
  //       );

  //       return null;
  //     }
  //     catch (error) {
  //       console.error(error);
  //       throw new functions.https.HttpsError('unknown', 'image optimization error', error);
  //     }
  //   });






  const orient = functions.
    runWith({timeoutSeconds: 300}). // Extended runtime of 5 min. for large files (default 60 sec).
    storage.
    object().
    onFinalize(processImg('oriented', '', ['-auto-orient']));


  const optimize = functions.
    runWith({timeoutSeconds: 300}). // Extended runtime of 5 min. for large files (default 60 sec).
    storage.
    object().
    onFinalize(processImg('optimized', OPTIM_PREFIX, [
      '-auto-orient',
      '-filter',     'Triangle',
      '-define',     'filter:support=2',
      '-resize',     `${OPTIM_MAX_WIDTH}>`, // Keeps original aspect ratio.
      '-unsharp',    '0.25x0.25+8+0.065',
      '-dither',     'None',
      '-posterize',  '136',
      '-quality',    '82',
      '-define',     'jpeg:fancy-upsampling=off',
      '-define',     'png:compression-filter=5',
      '-define',     'png:compression-level=9',
      '-define',     'png:compression-strategy=1',
      '-define',     'png:exclude-chunk=all',
      '-interlace',  'none',
      '-colorspace', 'sRGB',
      '-strip'
    ]));


  const thumbnail = functions.
    runWith({timeoutSeconds: 300}). // Extended runtime of 5 min. for large files (default 60 sec).
    storage.
    object().
    onFinalize(processImg('thumbnail', THUMB_PREFIX, [
      '-auto-orient',
      '-thumbnail', 
      `${THUMB_MAX_WIDTH}>` // Keeps original aspect ratio.
    ]));


  // Create a copy of the original file so that the client
  // can update the metadata of the shareable copy to better
  // suit viewing in a browser rather than dowloading.
  const createShareable = functions.https.onCall(async data => {
    try {

      // Can pass a bucketName to use a different bucket than the default.
      const {bucketName, path: filePath, type, uid} = data;

      if (!filePath || !type || !uid) {
        throw new functions.https.HttpsError('unknown', 'createShareable missing args.');
      }

      // Exit if this is triggered on a file that is a jpeg or png
      // since the 'optimize' cloud function already provides a 
      // link for these.
      if (isOptimizable(type)) {
        console.log('This file is an optimizable image. Not copying.');
        return null;
      }

      const fileDir   = path.dirname(filePath);
      const fileName  = path.basename(filePath);
      const sharePath = getNewFilePath(fileDir, SHARE_PREFIX, fileName);      
      const bucket    = admin.storage().bucket(bucketName); // 'bucketName' optional.
      const original  = bucket.file(filePath);

      await original.copy(sharePath);
      
      const {coll, doc} = getCollAndDoc(fileDir);

      // Add data to existing firestore doc.
      await admin.firestore().collection(coll).doc(doc).set(
        {sharePath}, // Used to get a shareable link.
        {merge: true}
      );

      return null;
    }
    catch (error) {
      console.error(error);
      throw new functions.https.HttpsError('unknown', 'createShareable error', error);
    }
  });

  return {createShareable, optimize, orient, thumbnail};
};
