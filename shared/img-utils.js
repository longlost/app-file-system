

// Using CommonJS Modules syntax here as this 
// must work with node.js as well as webpack.


exports.canProcess = file => {
	const {type} = file;

	return type.startsWith('image/') &&
				 (
				 	 // These image types are supported by both 
				 	 // the HTML <img/> tag and ImageMagick.
				 	 type.includes('bmp')  || 
    			 type.includes('gif')  || 
    			 type.includes('jpeg') ||
    			 type.includes('png')  || 
    			 type.includes('webp')
				 );
};


exports.canReadExif = file => {
	const {type} = file;

	return type.startsWith('image/') &&
				 (
				 	 // These image types are supported by both 
				 	 // the HTML <img/> tag and `exifreader` library.
    			 type.includes('jpeg') ||
    			 type.includes('png')  || 
    			 type.includes('webp')
				 );
};
