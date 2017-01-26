define(['app', 'backbone', 'core/edit'], function(app, Backbone, EditView) {

  return Backbone.Layout.extend({
    template: 'modal/columns-options-edit',

    beforeRender: function() {
      this.insertView('#form-columns-options', this.editView);
    },

    save: function() {
      this.model.save(this.editView.data());
    },

    initialize: function() {
      this.editView = new EditView({
        model: this.model,
        structure: this.options.schema
      });
    }
  });
});
