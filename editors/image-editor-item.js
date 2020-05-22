
import {AppElement, html} from '@longlost/app-element/app-element.js';
import htmlString 				from './image-editor-item.html';
import '@longlost/app-shared-styles/app-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';
import './image-editor-icons.js';


class ImageEditorItem extends AppElement {
	static get is() { return 'image-editor-item'; }

	static get template() {
		return html([htmlString]);
	}


	static get properties() {
		return {

			buttonDisabled: Boolean,

			buttonIcon: String,

			buttonLabel: String,

			_icon: {
				type: String,
				computed: '__computeIcon(buttonIcon)'
			}

		};
	}


	__computeIcon(str) {
		return `image-editor-icons:${str}`;
	}


	async __btnClicked() {
		try {
			await this.clicked();

			this.fire('image-editor-item-btn-clicked');
		}
		catch (error) {
			if (error === 'click debounced') { return; }
			console.error(error);
		}
	}

}

window.customElements.define(ImageEditorItem.is, ImageEditorItem);
