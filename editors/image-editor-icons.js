
import '@polymer/iron-iconset-svg/iron-iconset-svg.js';
import htmlString from './image-editor-icons.html';

const imageEditorIcons 		 = document.createElement('div');
imageEditorIcons.innerHTML = htmlString;
imageEditorIcons.setAttribute('style', 'display: none;');
document.head.appendChild(imageEditorIcons);
