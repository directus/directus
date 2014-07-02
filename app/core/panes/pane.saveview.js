define([
  "backbone",
  "app"
],

function(Backbone, app) {

  "use strict";

  var PaneSaveView = Backbone.Layout.extend({

    template: 'module-save',

    attributes: {'class': 'directus-module'},

    serialize: function() {
      var inactiveByDefault = this.model.collection.table.get('inactive_by_default');
      var isNew = !this.model.has('id');
      var data = {
        isActive: (this.model.get('status') === 1 || (isNew && !inactiveByDefault) ),
        isInactive: (this.model.get('status') === 2 || (isNew && inactiveByDefault)),
        isDeleted: (this.model.get('status') === 0),
        showDelete: !this.options.single && (this.model.get('status') !== 0) && (this.model.id !== undefined) && this.model.canDelete(),
        showActive: !this.options.single && this.model.getStructure().get('status') !== undefined,
        showDropdown: this.options.showDropDown,
        showSaveAsCopy: !this.model.isNew(),
        canEdit: this.model.canEdit(),
        buttonText: this.options.buttonText || 'Save Item'
      };
      return data;
    },

    initialize: function() {
      this.model.on('sync', this.render, this);
    }

  });

  return PaneSaveView;

});