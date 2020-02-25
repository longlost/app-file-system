

import {formatTimestamp} from '@longlost/utils/utils.js';
import path 						 from 'path';
import mime              from 'mime-types';


// const EXIF_TAGS = [
//   'DateTimeOriginal',   // Date and time string when image was originally created.
//   'GPSAltitude',        // Meters.
//   'GPSAltitudeRef',     // '0' - above sea level, '1' - below sea level.
//   'GPSDateStamp',       // UTC. 'YYYY:MM:DD'.
//   'GPSImgDirection',    // 'T' true north, or 'M' for magnetic north.
//   'GPSImgDirectionRef', // 0 - 359.99, degrees of rotation from north.
//   'GPSLatitude',        // Degrees, minutes, and seconds (ie. With secs - dd/1,mm/1,ss/1, or without secs dd/1,mmmm/100,0/1).
//   'GPSLatitudeRef',     // 'N' for north latitudes, 'S' for south latitudes.
//   'GPSLongitude',       // Degrees, minutes, and seconds (ie. With secs - dd/1,mm/1,ss/1, or without secs dd/1,mmmm/100,0/1).
//   'GPSLongitudeRef',    // 'E' for east longitudes, 'W' for west longitudes.
//   'GPSTimeStamp',       // UTC. hour, minute, sec.
//   'ImageDescription',   // User generated string for image (ie. 'Company picnic').
//   'Orientation'         // One of 8 values, most common are 1, 3, 6 and 8 since other are 'flipped' versions.
// ];


const coordsStr = ({degrees, minutes, seconds, direction}) => 
	seconds ? 
		`${degrees}º ${minutes}' ${seconds}" ${direction}` : 
		`${degrees}º ${minutes}' ${direction}`;


export const FileInfoMixin = superClass => {
  return class FileInfoMixin extends superClass {


    static get properties() {
	    return {

	      // File item object.
	      item: Object,

	      _dateTime: {
	      	type: String,
	      	computed: '__computeDateTime(item)'
	      },

	      _dirName: {
	      	type: String,
	      	computed: '__computeDirName(item.path)'
	      },

	      _gps: {
	      	type: String,
	      	computed: '__computeGPS(_lat, _lng)'
	      },

	      // Make exif data ready for <app-map>.
	      _lat: {
	      	type: Object,
	      	computed: `__computeCoord(item.geolocation.lat, item.exif, 'Latitude')`
	      },

	      // Make exif data ready for <app-map>.
	      _lng: {
	      	type: Object,
	      	computed: `__computeCoord(item.geolocation.lng, item.exif, 'Longitude')`
	      },

	      _mimeExt: {
	      	type: String,
	      	computed: '__computeMimeExt(item.type)'
	      },

	      _order: {
	      	type: String,
	      	computed: '__computeOrder(item.index)'
	      }

	    };
	  }


	  __computeCoord(position, exif, type) {

	  	if (position) { return position; }

	  	if (!exif) { return; }

	  	// ie. 'GPSLatitude'
	  	const numsKey = `GPS${type}`;
	  	const dirKey 	= `${numsKey}Ref`;

	  	if (!exif[numsKey] || !exif[dirKey]) { return; }

	  	const [degrees, minutes, seconds] = exif[numsKey];
	  	const [direction] 								= exif[dirKey];

	  	return {degrees, minutes, seconds, direction};
	  }


	  __computeDateTime(item) {
	    if (!item) { return ''; }

	    const {lastModified, timestamp} = item;
	    
	    const millis = lastModified ? lastModified : timestamp;	    

	    return formatTimestamp(millis, 'short');
	  }


	  __computeDirName(p) {
	  	return p ? path.dirname(p) : '';
	  }


	  __computeGPS(lat, lng) {
	  	if (!lat || !lng) { return ''; }

	  	if (typeof lat === 'number') { return `Lat ${lat}, Lng ${lng}`; }  	

	  	return `${coordsStr(lat)}, ${coordsStr(lng)}`;
	  }


	  __computeMimeExt(type) {
	  	return type ? mime.extension(type) : '';
	  }


	  __computeOrder(index) {
	    return typeof index === 'number' ? `${index + 1}` : '';
	  }

  };
};
