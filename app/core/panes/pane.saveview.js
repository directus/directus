define([
  "backbone",
  "app"
],

function(Backbone, app) {

  var PaneSaveView = Backbone.Layout.extend({
    template: 'module-save',
    attributes: {'class': 'directus-module'},
    serialize: function() {
      var data = {
        isActive: (this.model.get('active') === 1),
        isInactive: (this.model.get('active') === 2 || !this.model.has('id')),
        isDeleted: (this.model.get('active') === 0),
        showDelete: !this.options.single && (this.model.get('active') !== 0) && (this.model.id !== undefined),
        showActive: !this.options.single && this.model.collection.structure.get('active') !== undefined,
        showDropdown: !this.options.single,
        showSaveAsCopy: !this.model.isNew()
      };
      return data;
    },
    initialize: function() {
      this.model.on('sync', this.render, this);
    }
  });

  return PaneSaveView;

});