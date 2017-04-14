define(['app', 'backbone', 'core/edit'], function(app, Backbone, EditView) {

  return Backbone.Layout.extend({
    template: 'modal/columns-options-edit',

    beforeRender: function() {
      this.insertView('#form-columns-options', this.editView);
    },

    // TODO: Add this as a option in all views
    cleanup: function () {
      this.model.resetAttributes();
    },

    save: function() {
      this.model.save(this.editView.data());
    },

    serialize: function () {
      var columnModel = this.model.parent;

      return {
        isNew: columnModel.isNew(),
        table_name: columnModel.table.id,
        column_name: columnModel.get('column_name')
      }
    },

    initialize: function() {
      this.editView = new EditView({
        model: this.model,
        structure: this.options.schema
      });
    }
  });
});
