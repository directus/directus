define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'core/Modal',
  'modules/settings/views/ColumnFormView'
], function(app, _, Backbone, EditView, ModalView, ColumnFormView) {

  return ModalView.extend({

    attributes: {
      class: 'modal column'
    },

    template: Handlebars.compile('<div class="modal-bg crop"></div>'),

    events: {
      'click .js-cancel': '_close',

      'click .js-save': 'save'
    },

    _close: function() {
      // change Modal.close to Modal._close
      // change this._close to this.close
      // closing the modal should close it from their container
      this.container.close();
    },

    save: function() {
      if (this.formView.save()) {
        this._close();
      }
    },

    beforeRender: function() {
      this.setView('.modal-bg', this.formView);
    },

    initialize: function() {
      this.formView = new ColumnFormView({
        model: this.model,
        collection: this.collection
      });
    }
  });
});
