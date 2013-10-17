//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.saveview'
],

function(app, Directus, PaneSaveView) {

  "use strict";

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    getExpandedPermissions: function() {
    }

  });

  GroupPermissions.Permissions = Backbone.Layout.extend({

    template: 'settings-grouppermissions',

    serialize: function() {
      // Create data structure suitable for view
      var data = this.collection.map(function(model) {
        var permissions, read_field_blacklist, 
            write_field_blacklist, data, defaultPermissions;

        data = model.toJSON();

        permissions = (model.get('permissions') || '').split(','),
        read_field_blacklist = (model.get('read_field_blacklist') || '').split(),
        write_field_blacklist = (model.get('write_field_blacklist') || '').split();

        data.hasReadBlacklist = false;
        data.hasWriteBlacklist = false;

        // Default permissions
        data.permissions = {
          'add': false,
          'edit': false,
          'bigedit': false,
          'delete': false,
          'bigdelete': false,
          'alter': false,
          'view': false
        };

        _.each(permissions, function(property) {
          if (data.permissions.hasOwnProperty(property)) {
            data.permissions[property] = true;
          };
        });

        data.blacklist = app.columns[data.table_name].map(function(model) {
          var readBlacklist = _.contains(read_field_blacklist, model.id);
          var writeBlacklist = _.contains(write_field_blacklist, model.id);

          if (readBlacklist) {
            data.hasReadBlacklist = true;
            data.hasWriteBlacklist = true;
          }

          return {
            column_name: model.id,
            read: readBlacklist,
            write: writeBlacklist
          };
        });

        return data;
      })

      console.log(data);

      return {tables: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  GroupPermissions.Page = Backbone.Layout.extend({

    template: 'page',

    serialize: {
      title: 'XXX',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}]
    },

    afterRender: function() {
      var view = new GroupPermissions.Permissions({collection: this.collection});
      this.setView('#page-content', view);
      this.collection.fetch();
      //this.insertView('#sidebar', new PaneSaveView({model: this.model, single: this.single}));
    }

  });

  return GroupPermissions;
});