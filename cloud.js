'use strict';

const functions  = require('firebase-functions');
const admin      = require('firebase-admin'); // Access Storage and Firestore.
const os         = require('os');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');
const mkdirp     = require('mkdirp');
const spawn      = require('child-process-promise').spawn;
const imgUtils   = require('./shared/img-utils.js');

const OPTIM_RESIZE_FACTOR = '50%'; // Reduce original image size by half.
const OPTIM_TARGET_KB     = 100;   // Ideal max jpeg file size.
const OPTIM_MAX_SIZE      = 1024;  // Only used for video poster.
const THUMB_MAX_SIZE      = 256;
const OPTIM_PREFIX        = 'optim_';
const POSTER_PREFIX       = 'poster_';
const SHARE_PREFIX        = 'share_';
const THUMB_PREFIX        = 'thumb_';


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


// After an image is uploaded to the 
// Storage bucket:
//
// 1. Download to a temp directory.
//
// 2. Create an processed version.
//
// 3. Make each video file available for public download.
//    Expose 'optimized' as a shareable file. 
//
// 4. Save the public download urls for 
//    newly processed versions into Firestore.
//
//
// Uses ImageMagick to process images. 
//
// Auto orients all images and strips EXIF metadata so,
// all images display correctly across all browsers.
//
// Dynamically merges the url data into 
// the appropriate coll, doc.

const processMedia = (type, prefix, imgOpts, vidOpts) => async object => {

  // Outside of try block so 'fileDir' can be used by catch block.
  const {
    contentType,
    metadata,
    metageneration,
    name: filePath,
    size
  } = object;

  const fileDir  = path.dirname(filePath);


  try {

    const isImg   = imgUtils.canProcess({type: contentType});
    const isVideo = contentType.startsWith('video/');

    // Exit if this is triggered on a file that is not processable.
    if (!isImg && !isVideo) {
      console.log('This file is not a supported image or a video. Not processing.');
      return null;
    }

    // Exit if this is the original image that has already been processed on the client.
    if (isImg && !imgOpts) {
      console.log('Exiting. Already processed - Original.');
      return null;
    }

    // Exit if the image is already processed.
    if (metadata && (metadata['poster'] || metadata['optimized'] || metadata['thumbnail'])) {
      console.log('Exiting. Already processed - Metadata.');
      return null;
    }

    if (metageneration > 1) {
      console.log('Exiting. Already processed - Metageneration.');
      return null;
    }

    const ext      = path.extname(filePath);
    const fileExt  = isVideo ? '.jpeg' : ext;
    const fileName = isVideo ? 
      `${path.basename(filePath, ext)}${fileExt}` : // Replace video file ext with image ext.
      path.basename(filePath);

    // Create random filenames with same extension as uploaded file.
    const randomFileName       = getRandomFileName(fileExt);
    const randomFileName2      = getRandomFileName(fileExt);
    const tempLocalFile        = getTempLocalFile(randomFileName);
    const tempLocalConvertFile = getTempLocalFile(randomFileName2);
    const newPath              = getNewFilePath(fileDir, prefix, fileName);
    const bucket               = admin.storage().bucket(object.bucket);
    const fileRef              = bucket.file(filePath);

    if (isImg) {

      const tempLocalDir = path.dirname(tempLocalFile);

      // Create the temp directory where the storage file will be downloaded.
      await mkdirp(tempLocalDir);

      // Fail gracefully if user has already deleted the file from storage.
      try {     

        // Download file from bucket.
        await fileRef.download({destination: tempLocalFile}); 
      }
      catch (error) {        

        // Cannot download original file.
        // Should be due to user performing an early delete.
        if (error.code && error.code === 404) {
          return null;
        }

        throw error;
      }

      // Convert the image using ImageMagick.
      await spawn('convert', [
        tempLocalFile,
        ...imgOpts,
        tempLocalConvertFile
      ]);
    }
    else {
      const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

      let fileUrl;

      // Fail gracefully if user has already deleted the file from storage.
      try {        

        // Allow the video to be downloaded publicly.
        if (type === 'poster') {
          await fileRef.makePublic();   
        }

        fileUrl = await getUrl(bucket, filePath);
      }
      catch (error) {

        // Cannot download original file.
        // Should be due to user performing an early delete.
        if (error.code && error.code === 404) {
          return null;
        }

        throw error;
      }

      // Extract a poster with ffmpeg.
      await spawn(ffmpegPath, [
        '-ss',               // Seek to a position flag.
        '0',                 // Seek to val.
        '-i',                // File input flag.
        fileUrl,             // File input val.
        '-f',                // Output format flag.
        'image2',            // Image output format val.
        '-vframes',          // How many frames to handle flag.
        '1',                 // How many frames val.
        ...vidOpts,          // Unique to each type.
        tempLocalConvertFile // Output.
      ]);
    }
    
    const newMetadata = {

      // Images extracted from video are always jpegs.
      contentType: isVideo ? 'image/jpeg' : contentType,

      // Setting new contentDisposition here has no effect.
      // Can only be done on client with Storage SDK.
      metadata: {
        [type]:         'true',
        'originalSize': `${size}`,
        'uid':           metadata.uid
      }
    };

    // Upload new processed image/poster.
    await bucket.upload(tempLocalConvertFile, {
      destination:    newPath, 
      predefinedAcl: 'publicRead', 
      metadata:       newMetadata
    });

    // Delete the local files to free up disk space.
    if (isImg) {
      fs.unlinkSync(tempLocalFile); 
    }

    fs.unlinkSync(tempLocalConvertFile);

    // Save new url to Firestore.
    const {coll, doc} = getCollAndDoc(fileDir); 

    const url = await getUrl(bucket, newPath); 

    const download = {[type]: url};
   
    const data = type === 'optimized' ? 
      Object.assign({sharePath: newPath}, download) :  // Used to get a shareable link.
      download;

    // Consume update errors that occur when the document
    // does not exist. This should only happen when the user
    // executes an early delete, before cloud processing has
    // completed.
    try {

      // Add download url data to existing firestore doc.
      await admin.firestore().collection(coll).doc(doc).update(data);
    }
    catch (error) {

      // User already deleted the item so ignore the 'not-found' error.
      // Delete the newly uploaded file from storage.
      if (error.code && error.code === 5) { // Code 5 - 'not-found'.

        // Fail gracefully in case the file has already been removed by client.
        try {          
          const newFileRef = bucket.file(newPath);

          await newFileRef.delete();
        }
        catch (_) {} 

        return null;
      }

      throw error;
    }

    return null;
  }
  catch (error) {
    console.error(error);

    const {coll, doc} = getCollAndDoc(fileDir);

    await admin.firestore().collection(coll).doc(doc).set(
      {[`${type}Error`]: 'failed'}, 
      {merge: true}
    );

    return null;
  }
};




// Image files - Ignored since they are processed on the client.
// Video files - Use ffmpeg to extract a full-fidelity poster image.
exports.poster = functions.
  runWith({
    memory:        '1GB',
    timeoutSeconds: 300, // Extended runtime of 5 min. for large files (default 60 sec).
  }). 
  storage.
  object().
  onFinalize(processMedia(
    'poster',       // Type. Becomes db object key.
     POSTER_PREFIX, // Url filename prefix.

    // Image options. 'Original' version is processed on the client.
    undefined,

    // Video options.
    [
      '-qscale:v', // Quality scale flag.
      '1',         // Quality scale val. (1 - 31, lower is better quality).
    ]
  ));
  

// Image files - Use ImageMagic to create a medium-fidelity copy.
// Video files - Use ffmpeg to extract a medium-fidelity poster image.
exports.optimize = functions.
  runWith({
    memory:        '1GB',
    timeoutSeconds: 300, // Extended runtime of 5 min. for large files (default 60 sec).
  }). 
  storage.
  object().
  onFinalize(processMedia(
    'optimized',   // Type. Becomes db object key.
     OPTIM_PREFIX, // Url filename prefix.

    // Image options.
    // see https://www.smashingmagazine.com/2015/06/efficient-image-resizing-with-imagemagick/
    // see https://www.imagemagick.org/Usage/resize/
    [
      '-auto-orient', // Places image upright for viewing.
      '-filter',      'Triangle',
      '-define',      'filter:support=2',
      '-resize',       OPTIM_RESIZE_FACTOR,
      '-quantize',    'transparent', // Important for PNG's to have a smaller file size than original.
      '-colors',      '255',         // Important for PNG's to have a smaller file size than original.
      '-unsharp',     '0.25x0.25+8+0.065',
      '-quality',     '82',
      '-define',      'jpeg:fancy-upsampling=off', // Increases file size without much quality improvement.
      '-define',      `jpeg:extent=${OPTIM_TARGET_KB}kb`, // Ideal max file size.
      '-define',      'png:compression-filter=5',         // Adaptive filtering.
      '-define',      'png:compression-level=9',          // Use maximum available cpu/memory resources.
      '-define',      'png:compression-strategy=1',       // Default strat.
      '-define',      'png:exclude-chunk=all',
      '-interlace',   'none',
      '-colorspace',  'sRGB',
      '-strip',       // Removes all metadata.
    ],

    // Video options.
    [
      '-vf',                        // Filter flag.
      `scale=${OPTIM_MAX_SIZE}:-1`, // Filter scale val. -1 for height preserves aspect.
      '-qscale:v',                  // Quality scale flag.
      '4',                          // Quality scale val. (1 - 31, lower is better quality).
    ]
  ));


// Image files - Use ImageMagic's '-thumbnail' to create a low-fidelity copy 
// that is right-side-up and ready to view in app.
// Video files - Use ffmpeg to extract a low-fidelity poster image.
exports.thumbnail = functions.
  runWith({
    memory:        '1GB',
    timeoutSeconds: 300, // Extended runtime of 5 min. for large files (default 60 sec).
  }). 
  storage.
  object().
  onFinalize(processMedia(
    'thumbnail',   // Type. Becomes db object key.
     THUMB_PREFIX, // Url filename prefix.

    // Image options.
    [ 
      '-auto-orient', // Places image upright for viewing.
      '-thumbnail', `${THUMB_MAX_SIZE}x${THUMB_MAX_SIZE}>`, // Keeps original aspect ratio.
      '-quantize',  'transparent', // Important for keeping PNG file size small.
      '-colors',    '255',         // Important for keeping PNG file size small.
      '-strip' // Removes all metadata.
    ],

    // Video options.
    [
     '-vf',                         // Filter flag.
      `scale=${THUMB_MAX_SIZE}:-1`, // Filter scale val. -1 for height preserves aspect.
      '-qscale:v',                  // Quality scale flag.
      '5',                          // Quality scale val. (1 - 31, lower is better quality).
    ]  ));

// Create a copy of the original file so that the client
// can update the metadata of the shareable copy to better
// suit viewing in a browser rather than dowloading.
exports.createShareable = functions.https.onCall(async data => {
  try {

    // Can pass a bucketName to use a different bucket than the default.
    const {bucketName, path: filePath, type, uid} = data;

    if (!filePath || !type || !uid) {
      throw new functions.https.HttpsError('unknown', 'createShareable missing args.');
    }

    // Exit if this is triggered on a file that is a jpeg or png
    // since the 'optimize' cloud function already provides a 
    // link for these.
    if (imgUtils.canProcess({type})) {
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
    await admin.firestore().collection(coll).doc(doc).update({sharePath});

    return null;
  }
  catch (error) {
    console.error(error);

    // Return proper Firebase onCall error back to client.
    throw new functions.https.HttpsError('unknown', 'createShareable error', error);
  }
});
