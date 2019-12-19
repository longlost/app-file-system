
/**
  * `web-file-card`
  * 
  *   Import a file off the web from a url link. 
  *   
  *  
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
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
  *    'file-added' - Fired after file is downloaded from web and available for further processing.
  *                       detail -> {file: <JS File Object>}
  *
  *  
  *
  *  
  *  Methods:
  *
  *
  *    
  *
  *
  *
  **/


import {
  AppElement, 
  html
}                   from '@longlost/app-element/app-element.js';
import {
  blobToFile
}                   from '@longlost/lambda/lambda.js';
import {
  message,
  schedule,
  wait,
  warn
}                   from '@longlost/utils/utils.js';
import path         from 'path'; // webpack includes this by default!
import mime         from 'mime-types';
import htmlString   from './web-file-card.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-progress/paper-progress.js';
import '../shared/file-icons.js';


// 'callback' will be passed an object with the following properties:
//
//    cancel, loaded, progress, total
//
// Calling 'cancel' will halt stream and throw an error
// with error.message set to 'Failed to fetch'.
const fetchFile = async (url, callback, options) => {

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const reader = response.body.getReader();

  // Get total file length.
  const total = response.headers.get('Content-Length');

  // Get file type.
  const type = response.headers.get('Content-Type');

  const stream = new ReadableStream({
    start(controller) {

      // Read the data.
      let loaded = 0;
      // Calling cancel will halt stream and throw an error
      // with error.message set to 'Failed to fetch'.
      const cancel = controller.error.bind(controller);

      const pump = async () => {

        const {done, value} = await reader.read();

        // When no more data needs to be consumed, close the stream
        if (done) {
          controller.close();
          return;
        }

        loaded += value.length;

        const progress = total ? (loaded / total) * 100 : 100;

        callback({cancel, loaded, progress, total, type});
        // Enqueue the next data chunk into our target stream
        controller.enqueue(value);

        return pump();
      };

      return pump();      
    }
  });

  const streamResponse = await new Response(stream);
  const blob           = await streamResponse.blob();

  const name = path.basename(url);
  const file = blobToFile(blob, name, type);

  return file;
};


class WebFileCard extends AppElement {
  static get is() { return 'web-file-card'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      // This array containes mime types (ie. 'image/jpeg').
      // It us used to check against fetch response 'content-type' in order
      // to be sure we are only loading the desired types of files.
      mimes: Array,

      // Cancel method for ReadableStream instance from fetchFile function.
      _cancel: Object,

      // Data-bind to #cancel-btn disabled prop.
      _cancelBtnDisabled: {
        type: Boolean,
        value: true,
        computed: '__computeCancelBtnDisabled(_cancel)'
      },



      // _url: String


      // _url: {
      //   type: String,
      //   value: 'https://app-layout-assets.appspot.com/assets/bg4.jpg'
      // }

      _url: {
        type: String,
        value: 'https://fetch-progress.anthum.com/20kbps/images/sunrise-progressive.jpg'
      },




      // Data-bind to <paper-progress>
      _progress: {
        type: Number,
        value: 0
      },

      // fetch response 'Content-Type' header string.
      // We use this to check the incoming file type
      // against the accept property to make sure
      // the user is fetching the appropriate 
      // type of file for a given application.
      _type: String,

      // Disable import button until url contains a valid mime type.
      _valid: {
        type: Boolean,
        value: false,
        computed: '__computeValid(_url, mimes)'
      }

    };
  }


  static get observers() {
    return [
      '__cancelMimesAndTypeChanged(_cancel, mimes, _type)'
    ];
  }


  __computeCancelBtnDisabled(cancel) {
    return !Boolean(cancel);
  }


  __computeValid(url, mimes) {
    if (!url || !mimes) { return false; }

    const type = mime.contentType(path.extname(url));

    return mimes.some(m => type.includes(m));
  }


  async __cancelMimesAndTypeChanged(cancel, mimes, type) {
    if (!cancel || !mimes || !type) { return; }

    const shouldNotCancel = mimes.some(m => 
                              type.includes(m));

    if (shouldNotCancel) { return; }

    warn('This import is not an acceptable type of file.');
    await schedule();
    cancel();
  }

  



  __inputValueChanged(event) {
    // const {value}      = event.detail;
    // this._url = value.trim();
  }




  async __downloadBtnClicked() {
    try {
      await this.clicked();
      this.$.progress.classList.add('show');
      await wait(350);

      const callback = status => {
        const {cancel, progress, type} = status;
        this._cancel   = cancel;
        this._progress = progress;
        this._type     = type;
      };

      const file = await fetchFile(this._url, callback);

      this.fire('file-added', {file});
    }
    catch (error) {
      if (error === 'click debounced') {
        return;
      } else if (error.message === 'Failed to fetch') {
        message('Import cancelled.');
      } else {
        console.error(error);
        await warn('Could not import the file.');
      }
    }
    finally {
      await schedule();
      this.$.progress.classList.remove('show');
      await wait(350);      
      this._cancel   = undefined;
      this._progress = 0;
      this._type     = undefined;
    }
  }


  async __cancelBtnClicked() {
    try {
      await this.clicked();
      if (this._cancel) {
        this._cancel();
      }
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(WebFileCard.is, WebFileCard);
