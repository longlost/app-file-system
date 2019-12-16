
import '@polymer/iron-iconset-svg/iron-iconset-svg.js';
import htmlString from './file-icons.html';

const fileIcons 		= document.createElement('div');
fileIcons.innerHTML = htmlString;
fileIcons.setAttribute('style', 'display: none;');
document.head.appendChild(fileIcons);
