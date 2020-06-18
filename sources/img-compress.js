
// Extract EXIF tags and generate a random hash
// for a file in preparation for display and upload.

import * as Magick from 'wasm-imagemagick/dist/magickApi.js';


// In @longlost/tools/dev.js and build.js must add the following to copy necessary files


    // // Pass a stubbed version of service worker file to dev server.
    // new CopyWebpackPlugin([{
    //   from: './src/service-worker.js', 
    //   to:   'service-worker.js'
    // }, {
    //   from: './src/images', 
    //   to:   'images'
    // },{
    //   from: './src/robots.txt', 
    //   to:   'robots.txt'
    // }, {
    //   from: './src/sitemap.xml', 
    //   to:   'sitemap.xml'
    // }, {
    //   from: './node_modules/wasm-imagemagick/dist/magick.wasm',
    //   to:   'magick.wasm'
    // }, {
    //   from: './node_modules/wasm-imagemagick/dist/magick.js',
    //   to:   'magick.js'
    // }]),




const IMAGE_QUALITY 	= 80; 	// 0 - 100, 100 is no change in quality. Used for jpeg/bmp/tiff/gif.
const PNG_COMPRESSION = 9;  	// 0 - 9, 0 is no compression. Used for png only.
const MAX_MB 					= 1;  	// Target max file size.
const MAX_SIZE 				= 2048; // Maximum image dimensions.
const MIN_SCALE 	 		= 0.75;	// Reduce large image file dimensions at least this much.


const readAsArrayBuffer = file => {

	const reader = new FileReader();
	reader.readAsArrayBuffer(file);

	return new Promise((resolve, reject) => {

		reader.onload = () => {
			resolve(reader.result);
		};

		reader.onerror = reject;
	});
};


const compressor = async file => {

  const buffer 		= await readAsArrayBuffer(file);
	const content 	= new Uint8Array(buffer);
	const inputName = `input_${file.name}`;
	const image 		= {content, name: inputName};
	const commands  = [
  	'convert', inputName, 
  	'-sampling-factor', '4:2:0',
  	'-strip', 
  	'-auto-gamma', 
  	'-adaptive-resize', '60%', 
  	'-quality', '82', 
  	'-unsharp', '0x0.75+0.75+0.008', 
  	file.name
  ];


	const {exitCode, outputFiles, stderr} = await Magick.call([image], commands);


	if (exitCode === 0) {

		const processedBuffer = outputFiles[0].buffer;
		const compressed 			= new File([processedBuffer], file.name, {type: file.type});

		return compressed;
	}
	else {
		throw result.stderr;
	}
};


const compress = file => {

	if (!file) { return; }

	// Only process image files that ImageMagick supports.
	if (
		file.type.includes('bmp')  ||
		file.type.includes('jpeg') || 
		file.type.includes('jpg')  || 
		file.type.includes('png')  ||
		file.type.includes('tiff')
	) { 
		return compressor(file); 
	}

	return file;
};


export default compress;
