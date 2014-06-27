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
  'core/widgets/widgets',
  'core/panes/pane.saveview'
],

function(app, Backbone, BasePageView, Widgets, PaneSaveView) {

  "use strict";

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    getExpandedPermissions: function() {
    }

  });

  var EditFieldsOverlay = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Edit Fields',
        isOverlay: true
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "saveBtn", iconClass: "icon-check", buttonClass: "add-color-background"}})
      ];
    },

    events: {
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      },
      'click #saveBtn': function() {
        this.save();
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.contentView);
    },

    initialize: function(options) {
      this.contentView = new EditFields({model: this.model});
    }
  });

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/settings-grouppermissions-editfield',

    events: {
      'click td > span': function(e) {
        var $target = $(e.target),
            $tr = $target.closest('tr');

      var readBlacklist = (this.model.get('read_field_blacklist')) ? this.model.get('read_field_blacklist').split(',') : [];
      var writeBlacklist = (this.model.get('write_field_blacklist')) ? this.model.get('write_field_blacklist').split(',') : [];


        this.toggleIcon($target);

        //Removing so add to blacklist
        if($target.parent().hasClass('delete-color')) {
          if($target.parent().parent().data('value') == "read") {
            if(readBlacklist.indexOf($tr.data('column-name')) === -1) {
              readBlacklist.push($tr.data('column-name'));
              this.model.set({read_field_blacklist: readBlacklist.join(",")});
            }
          } else {
            if(writeBlacklist.indexOf($tr.data('column-name')) === -1) {
              writeBlacklist.push($tr.data('column-name'));
              this.model.set({write_field_blacklist: writeBlacklist.join(",")});
            }
          }
        } else {
          if($target.parent().parent().data('value') == "read") {
            if(readBlacklist.indexOf($tr.data('column-name')) !== -1) {
              readBlacklist.splice(readBlacklist.indexOf($tr.data('column-name')), 1);
              this.model.set({read_field_blacklist: readBlacklist.join(",")});
            }
          } else {
            if(writeBlacklist.indexOf($tr.data('column-name')) !== -1) {
              writeBlacklist.splice(writeBlacklist.indexOf($tr.data('column-name')), 1);
              this.model.set({write_field_blacklist: writeBlacklist.join(",")});
            }
          }
        }
      }
    },

    toggleIcon: function($span) {
      $span.parent().toggleClass('add-color').toggleClass('delete-color');
      $span.toggleClass('icon-block').toggleClass('icon-check');
    },

    serialize: function() {
      var data = {columns: []};
      var readBlacklist = (this.model.get('read_field_blacklist') || '').split(',');
      var writeBlacklist = (this.model.get('write_field_blacklist') || '').split(',');

      data.columns = app.schemaManager.getColumns('tables', this.model.get('table_name'))
            .filter(function(model) {if(model.id === 'id') {return false;} return true;})
            .map(function(model) {
              return {column_name: model.id, read: (readBlacklist.indexOf(model.id) == -1), write: (writeBlacklist.indexOf(model.id) == -1)};
            }, this);

      return data;
    },

    save: function() {
    },

    initialize: function(options) {
      this.render();
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
      'click td.editFields > span': 'editFields',
      'click td > span': function(e) {
        var $target = $(e.target).parent(),
            $tr = $target.closest('tr'),
            permissions, cid, attributes, model;

        if($target.hasClass('editFields')) {
          return;
        }

        cid = $tr.data('cid');
        this.toggleIcon($target, this.collection.get(cid).get('permissions'));

        attributes = this.parseTablePermissions($tr, this.collection.get(cid).get('permissions'));

        model = this.collection.get(cid);
        model.set(attributes);
        model.save();
      }
    },

    toggleIcon: function($span, currentPermission) {
      var dataValue = $span.parent().data('value');
      if($span.hasClass('yellow-color')) {
        $span.addClass('big-priv');
      } else {
        $span.toggleClass('add-color').toggleClass('delete-color').toggleClass('has-privilege');
      }

    },

    parseTablePermissions: function($tr) {
      var permissions;

      permissions = $tr.children().has('span.has-privilege');

      permissions = permissions.map(function() { return (($(this).has('span.big-priv').length) ? "big" : "") +  $(this).data('value');}).get().join();

      return {permissions: permissions};
    },

    editFields: function(e) {
      var $target = $(e.target).parent(),
        $tr = $target.closest('tr'),
        cid, model;

        cid = $tr.data('cid');

      var model = this.collection.get(cid);
      //@todo: link real col
      var view = new EditFieldsOverlay({model: model});
      app.router.overlayPage(view);

      view.save = function() {
        view.model.save();
        app.router.removeOverlayPage(view);
      }
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