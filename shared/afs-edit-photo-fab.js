

/**
  * `afs-edit-photo-fab`
  * 
  *   An animated fab that opens the `image-editor` when clicked.
  *
  *
  *
  *
  *  Properties:
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
  *
  *
  *   @customElement
  *   @polymer
  *   @demo demo/index.html
  *
  **/


import {AppElement, html}  from '@longlost/app-core/app-element.js';
import {schedule, wait}    from '@longlost/app-core/utils.js';
import htmlString          from './afs-edit-photo-fab.html';
import '@polymer/paper-fab/paper-fab.js';
import '../shared/afs-file-icons.js';


class AFSEditPhotoFab extends AppElement {
  static get is() { return 'afs-edit-photo-fab'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      item: Object,

      parentControls: {
        type: Boolean,
        value: false
      },

      _hidden: {
        type: Boolean,
        value: true,
        computed: '__computeHidden(item)'
      }

    };
  }


  static get observers() {
    return [
      '__hiddenChanged(_hidden)'
    ];
  }


  __computeHidden(item) {
    if (!item || !item.type) { return true; }

    const {optimized, poster, thumbnail, type} = item;

    if (type.includes('image')) {
      return false;
    }

    if (type.includes('video')) {

      // Can't edit if all poster generating cloud processes failed.
      if (!optimized && !poster && !thumbnail) {
        return true;
      }

      return false;
    }

    return true;
  }


  __hiddenChanged(hidden) {
    if (this.parentControls) { return; }

    if (hidden) {
      this.exit();
    }
    else {
      this.enter();
    }
  }


  async __fabClicked() {
    try {
      await this.clicked();

      this.fire('edit-image', {item: this.item});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async enter() {
    if (this._hidden) { return; }

    this.style['display'] = 'inline-block';

    await schedule();

    this.$.fab.classList.add('fab-animation');

    return wait(450);
  }

 
  async exit() {
    if (this._hidden) { return; }

    this.$.fab.classList.remove('fab-animation');

    await wait(450);

    this.style['display'] = 'none';
  }


  reset() {
    this.$.fab.classList.remove('fab-animation');
    this.style['display'] = 'none';
  }

}

window.customElements.define(AFSEditPhotoFab.is, AFSEditPhotoFab);
