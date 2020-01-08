

/**
  * `share-modal`
  * 
  *   Displays a shareable link for a given file.  
  * 	Allows user to easily save link to clipboard.
  *
  *
  *   
  *
  *
  *
  *
  *  Properites:
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
  *  
  *  Methods:
  *
  *
  *    
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
	message,

	// testing only
	wait,



	warn
} 								from '@longlost/utils/utils.js';
import services   from '@longlost/services/services.js';
import htmlString from './share-modal.html';
import '@longlost/app-modal/app-modal.js';
import '@longlost/app-spinner/app-spinner.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './shared/file-icons.js';



// const fileDir = path.dirname(filePath);
// const fileName = path.basename(filePath);
// const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));


class ShareModal extends AppElement {
  static get is() { return 'share-modal'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

    	_hideCopyBtn: {
    		type: Boolean,
    		value: true
    	},

      _shareLink: String

    };
  }


  connectedCallback() {
  	super.connectedCallback();

  	if ('clipboard' in navigator) {
  		this._hideCopyBtn = false;
  	}
  }


  async __copyBtnClicked() {
  	try {
  		await this.clicked();

  		await navigator.clipboard.writeText(this._shareLink);

  		message('Link copied to your clipboard.');
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  		warn('Could not copy the link.');
  	}
  }


  async __dismissBtnClicked() {
  	try {
  		await this.clicked();
  		this.$.modal.close();
  	}
  	catch (error) {
  		if (error === 'click debounced') { return; }
  		console.error(error);
  	}
  }


  async open(item) {
  	try {
  		await this.$.spinner.show('Creating your link.');
  		await this.$.modal.open();

  		// if (!item.share) {
  		// 	await services.cloudFunction({name: 'makeFileShareable', item});
  		// }

  		// this._shareLink = await services.getDownloadUrl(item.share);

  		this._shareLink = 'test-link-asdlkjasdg;lkjasdg;lkjasdg;lkjasdg;lkjasgh.txt';

  		await wait(1000);
  	}
  	catch (error) {
  		console.error(error);
  		await warn('An error occured while creating the link.');
  		this.$.shareModal.close();
  	}
  	finally {
  		this.$.spinner.hide();
  	}
  }

}

window.customElements.define(ShareModal.is, ShareModal);
