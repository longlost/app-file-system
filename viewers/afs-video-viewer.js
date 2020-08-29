

/**
  * `afs-video-viewer`
  * 
  *   Video fullscreen viewer overlay.
  *
  *
  *
  *  Properites:
  *
  *
  *    
  *
  *
  *
  *  Events:
  *
  *
  *   
  *  
  *  Methods:
  *
  *
  *    open()
  *
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString         from './afs-video-viewer.html';
import '@longlost/app-overlays/app-overlay.js';
import '@longlost/lazy-video/lazy-video.js';


class AFSVideoViewer extends AppElement {
  static get is() { return 'afs-video-viewer'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // Used for entry animation and inital setup.
      item: Object,

      _opened: {
      	type: Boolean,
      	value: false
      },

      _src: {
        type: String,
        computed: '__computeSrc(item, _opened)'
      }

    };
  }


  __computeSrc(item, opened) {
    if (!item || !opened) { return '#'; }

    const {_tempUrl, original} = item;

    return original ? original : _tempUrl;
  }


  __reset() {
  	this._opened = false;
  }


  async __backBtnClicked() {
    try {
      await this.clicked();

      this.$.overlay.back();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async open() {      
    await this.$.overlay.open();

    this._opened = true;
  }

}

window.customElements.define(AFSVideoViewer.is, AFSVideoViewer);
