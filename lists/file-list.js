
/**
  * `file-list`
  * 
  *   Shows file items in a rearrangeable list.
  *
  *
  *
  *
  *  Properites:
  *
  *
  *    coll - <String> required: firestore collection path to use when saving.
  *           ie. `cms/ui/programs`, 'images', `users`
  *           default -> undefined
  *
  *
  *  
  *    uploads - Collection of file upload objects that are combined with database items.
  *
  *  
  *
  *
  *
  *
  * @customElement
  * @polymer
  * @demo demo/index.html
  *
  *
  **/


import {AppElement, html} from '@longlost/app-element/app-element.js';
import {ListOverlayMixin} from './list-overlay-mixin.js';
import htmlString         from './file-list.html';
// 'file-items' lazy loaded after open.


class FileList extends ListOverlayMixin(AppElement) {
  static get is() { return 'file-list'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      hideDropzone: Boolean,

    };
  }




  // Start a subscription to file data changes.
  async __collChanged(coll) {
    if (!coll) { return; }

    if (this._unsubscribe) {
      this._unsub();
    }
    else { 

      // App is still initializing, 
      // so give <app-settings> time to call enablePersistence
      // on services before calling subscribe.
      await wait(500);
    }


    const callback = results => {

      // Filter out orphaned data that may have been caused
      // by deletions prior to cloud processing completion.
      // Items from the database may have sparse index values
      // caused by deleted items, so collapse indexes.
      this._items = results.
                      filter(obj => obj.uid).
                      map((item, index) => ({...item, index}));
    };


    const errorCallback = error => {
      this._items  = undefined;

      if (
        error.message && 
        error.message.includes('document does not exist')
      ) { return; }

      console.error(error);
    };


    this._unsubscribe = services.subscribe({
      callback,
      coll,
      errorCallback,
      orderBy: {
        prop:      'index',
        direction: 'asc'
      }
    });
  }

  // Overlay 'on-reset' handler.
  __reset() {
    this._opened = false;
  }


  cancelDelete() {
    this.$.items.cancelDelete();
  }


  delete() {
    this.$.multi.delete();
    this.$.items.delete();
  }


  async open() {
    await this.$.overlay.open();

    this._opened = true;

    await import(
      /* webpackChunkName: 'app-file-system-file-items' */ 
      './file-items.js'
    );
  }


  resetDeleteTarget() {
    this.$.items.resetDeleteTarget();
  }

}

window.customElements.define(FileList.is, FileList);
