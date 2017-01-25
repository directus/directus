define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'core/Modal'
], function(app, _, Backbone, EditView, ModalView) {

  return ModalView.extend({

    attributes: {
      'id': 'modal',
      'class': 'modal interface'
    },

    template: 'modal/columns-edit',

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
      this.model.save(this.editView.data());
      this._close();
    },

    beforeRender: function() {
      this.insertView('#form-columns-edit', this.editView);
    },

    initialize: function() {
      this.editView = new EditView({
        model: this.model,
        structure: this.options.schema
      });
    }
  });
});
