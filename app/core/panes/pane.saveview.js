define([
  "backbone",
  "app"
],

function(Backbone, app) {

  var PaneSaveView = Backbone.Layout.extend({

    template: 'module-save',

    attributes: {'class': 'directus-module'},

    serialize: function() {
      var inactiveByDefault = this.model.collection.table.get('inactive_by_default');
      var isNew = !this.model.has('id');
      var data = {
        isActive: (this.model.get('active') === 1 || (isNew && !inactiveByDefault) ),
        isInactive: (this.model.get('active') === 2 || (isNew && inactiveByDefault)),
        isDeleted: (this.model.get('active') === 0),
        showDelete: !this.options.single && (this.model.get('active') !== 0) && (this.model.id !== undefined) && this.model.canDelete(),
        showActive: !this.options.single && this.model.getStructure().get('active') !== undefined,
        showDropdown: !this.options.single,
        showSaveAsCopy: !this.model.isNew(),
        canEdit: this.model.canEdit()
      };
      return data;
    },

    initialize: function() {
      this.model.on('sync', this.render, this);
    }

  });

  return PaneSaveView;

});