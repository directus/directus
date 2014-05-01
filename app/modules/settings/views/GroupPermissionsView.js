//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/BasePageView',
  'core/panes/pane.saveview'
],

function(app, Backbone, BasePageView, PaneSaveView) {

  "use strict";

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    getExpandedPermissions: function() {
    }

  });

  GroupPermissions.Permissions = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings'
      },
    },

    template: 'modules/settings/settings-grouppermissions',

    events: {
      'click td > span': function(e) {
        var $target = $(e.target),
            $tr = $target.closest('tr'),
            permissions, cid, attributes, model;

        this.toggleIcon($target);

        cid = $tr.data('cid');
        attributes = this.parseTablePermissions($tr);

        model = this.collection.get(cid);
        model.set(attributes);
        model.save();
      }
    },

    toggleIcon: function($span) {
        $span.toggleClass('add-color')
             .toggleClass('delete-color');
    },

    parseTablePermissions: function($tr) {
      var cid, id, permissions;

      permissions = $tr.children()
                       .has('span.add-color')
                       .map(function() { return $(this).data('value'); })
                       .get()
                       .join();

      return {permissions: permissions};
    },

    serialize: function() {
      // Create data structure suitable for view
      var data = this.collection.map(function(model) {
        var permissions, read_field_blacklist,
            write_field_blacklist, data, defaultPermissions;

        data = model.toJSON();
        data.cid = model.cid;
        data.title = app.capitalize(data.table_name, '_', true);

        permissions = (model.get('permissions') || '').split(',');

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
          'view': false,
          'bigview': false
        };

        _.each(permissions, function(property) {
          if (data.permissions.hasOwnProperty(property)) {
            data.permissions[property] = true;
          }
        });

        /*
        Don't blacklist columns yet
        read_field_blacklist = (model.get('read_field_blacklist') || '').split();
        write_field_blacklist = (model.get('write_field_blacklist') || '').split();

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
        */

        return data;
      });

      return {tables: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  GroupPermissions.Page = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}]
      },
    },
    afterRender: function() {
      var view = new GroupPermissions.Permissions({collection: this.collection});
      this.setView('#page-content', view);
      this.collection.fetch();
      //this.insertView('#sidebar', new PaneSaveView({model: this.model, single: this.single}));
    },
    initialize: function() {
      this.headerOptions.route.title = this.options.title;
    }

  });

  return GroupPermissions;
});