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
const THUMB_PREFIX    = 'thumb_';


const getRandomFileName = ext => `${crypto.randomBytes(20).toString('hex')}${ext}`;
const getTempLocalFile  = name => path.join(os.tmpdir(), name);
const getNewFilePath    = (dir, prefix, name) => 
                            path.normalize(path.join(dir, `${prefix}${name}`));


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
  // the appropriate coll, doc and field.
  const optimizeStorageImages = functions.
    runWith({timeoutSeconds: 300}). // Extended runtime of 5 min. for large files (default 60 sec).
    storage.
    object().
    onFinalize(async object => {
      try {

        const {
          contentType,
          metageneration,
          metadata,
          name: filePath,
          size
        } = object;

        // Exit if this is triggered on a file that is not an image.
        if (!contentType.startsWith('image/')) {
          console.log('This file is not an image. Not optimizing.');
          return null;
        }

        // Exit if the image is already processed.
        if ((metadata && metadata.processed) || metageneration > 1) {
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
        const randomFileName     = getRandomFileName(fileExt);
        const randomFileName2    = getRandomFileName(fileExt);
        const randomFileName3    = getRandomFileName(fileExt);
        const tempLocalFile      = getTempLocalFile(randomFileName);
        const tempLocalDir       = path.dirname(tempLocalFile);
        const tempLocalOptimFile = getTempLocalFile(randomFileName2);    
        const tempLocalThumbFile = getTempLocalFile(randomFileName3);
        const optimFilePath      = getNewFilePath(fileDir, OPTIM_PREFIX, fileName);
        const thumbFilePath      = getNewFilePath(fileDir, THUMB_PREFIX, fileName);
        const bucket             = admin.storage().bucket(object.bucket);
        const fileRef            = bucket.file(filePath);

        // Create the temp directory where the storage file will be downloaded.
        await mkdirp(tempLocalDir);

        // Allow the original to be downloaded publicly.
        await fileRef.makePublic();

        // Download file from bucket.
        await fileRef.download({destination: tempLocalFile}); 

        // Best attempt at a happy medium of size/quality.
        const optimOptions = [
          tempLocalFile,
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
          '-strip',
          tempLocalOptimFile
        ];

        const thumbOptions = [
          tempLocalFile, 
          '-thumbnail', 
          `${THUMB_MAX_WIDTH}>`, // Keeps original aspect ratio.
          tempLocalThumbFile
        ];

        // Convert the image using ImageMagick.
        await Promise.all([
          spawn('convert', optimOptions), 
          spawn('convert', thumbOptions)
        ]);
        
        const newMetadata = {

          contentDisposition: null,


          metadata: {
            'field':         metadata.field,
            'processed':    'true',
            'originalSize': `${size}`,
            'uid':           metadata.uid
          }
        };

        // Upload new images.
        await Promise.all([
          bucket.upload(tempLocalOptimFile, {
            destination:    optimFilePath, 
            predefinedAcl: 'publicRead', 
            metadata:       newMetadata
          }),
          bucket.upload(tempLocalThumbFile, {
            destination:    thumbFilePath, 
            predefinedAcl: 'publicRead', 
            metadata:       newMetadata
          })
        ]);

        // Delete the local files to free up disk space.
        fs.unlinkSync(tempLocalFile); 
        fs.unlinkSync(tempLocalOptimFile);
        fs.unlinkSync(tempLocalThumbFile);

        // Get a download url.
        const getUrl = async toFilePath => {
          const f    = bucket.file(toFilePath);
          const meta = await f.getMetadata();
          return meta[0].mediaLink;
        };

        const [
          optimized, 
          thumbnail
        ] = await Promise.all([
          getUrl(optimFilePath), 
          getUrl(thumbFilePath)
        ]);        
        
        const words = fileDir.split('/');
        const coll  = words.slice(0, words.length - 1).join('/');
        const doc   = words[words.length - 1];

        // Fully dynamic save to firestore doc.
        await admin.firestore().collection(coll).doc(doc).set(
          {
            [metadata.field]: { // <app-file-system> custom element 'field' prop on client.
              [metadata.uid]: {
                optimized,
                thumbnail
              }
            }
          }, 
          {merge: true}
        );

        return null;
      }
      catch (error) {
        console.error(error);
        throw new functions.https.HttpsError('unknown', 'image optimization error', error);
      }
    });

  return optimizeStorageImages;
};
