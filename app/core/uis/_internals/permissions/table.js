define(['app', 'underscore', 'backbone', 'core/t', 'core/Modal'], function(app, _, Backbone, __t, ModalView) {

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/permissions-fields',

    events: {
      'click .js-select-column': 'onSelectColumn'
    },

    onSelectColumn: function(event) {
      var $checkbox = $(event.currentTarget);
      var $row = $checkbox.closest('tr');
      var attr = this.name + '_field_blacklist';
      var columnName = $row.data('column');
      var blacklist = (this.model.get(attr)) ? this.model.get(attr).split(',') : [];
      var changed = false;

      // Remove or add to blacklist
      if (!$checkbox.is(':checked')) {
        if (!this.hasColumn(columnName)) {
          blacklist.push(columnName);
          changed = true;
        }
      } else {
        if (this.hasColumn(columnName)) {
          blacklist.splice(blacklist.indexOf(columnName), 1);
          changed = true;
        }
      }

      if (changed) {
        var attrs = {};
        attrs[attr] = blacklist.join(',');
        this.model.save(attrs, {patch: true});
      }
    },

    hasColumn: function (name) {
      var blacklist = (this.model.get(this.name + '_field_blacklist') || '').split(',');

      return blacklist.indexOf(name) >= 0;
    },

    serialize: function () {
      var data = {columns: []};
      var blacklist = (this.model.get(this.name + '_field_blacklist') || '').split(',');

      data.permission = __t('permissions_' + this.name);
      data.name = this.name;

      data.columns = app.schemaManager.getColumns('tables', this.model.get('table_name'))
        .filter(function(model) {
          // @TODO: custom primary key
          return model.id !== 'id';
        })
        .map(function(model) {
          return {
            column_name: model.id,
            blacklisted: blacklist.indexOf(model.id) >= 0
          };
        }, this);

      return data;
    },

    initialize: function (options) {
      this.name = options.type;
      this.render();
    }
  });

  var EditFieldsModal = ModalView.extend({
    beforeRender: function () {
      this.setView('.modal-bg', this.view);
    },

    initialize: function (options) {
      this.view = new EditFields(options);
    }
  });

  return Backbone.Layout.extend({
    prefix: 'app/core/uis/_internals/permissions/',

    template: 'table',

    events: {
      'click .js-status-toggle': 'toggleStatusSelector',
      'click .js-status': 'changeStatus',
      'click .js-permission-toggle': 'togglePermission',
      'click .js-write.choose-column-blacklist': 'editWriteFields',
      'click .js-read.choose-column-blacklist': 'editReadFields'
    },

    toggleStatusSelector: function (event) {
      var $row = $(event.currentTarget).closest('tr');
      var id = $row.data('cid');
      var model = this.collection.get(id);

      if (!this.hasStatusColumn(model.get('table_name'))) {
        return;
      }

      $row.toggleClass('workflow-enabled');
    },

    changeStatus: function (event) {
      var $el = $(event.currentTarget);
      var value = $el.data('value');
      var $row = $el.closest('tr');
      var tableName = $row.data('table');
      var state = this.getDefaultStatus();

      if (!this.state.tables[tableName]) {
        this.state.tables[tableName] = {};
      }

      if (value !== null) {
        _.each(app.statusMapping.mapping, function (status, key) {
          if (key === value) {
            state = {
              name: status.name,
              value: key
            };
          }
        });
      }

      this.state.tables[tableName] = state;
      $row.toggleClass('workflow-enabled');
      this.render();
    },

    togglePermission: function (event) {
      var $toggle = $(event.currentTarget);
      var permission = $toggle.closest('td').data('name');
      var permissionName = 'allow_' + permission;
      var $row = $toggle.closest('tr');
      var tableName = $row.data('table');
      var model = this.collection.get($row.data('cid'));
      var attributes = {};
      var currentPermissionValue;
      var status = this.state.tables[tableName];
      var options;

      // @note: temporary empty privileges
      if (!model) {
        model = this.collection.at(0).clone();
        model.clear();
        model.set(app.schemaManager.getDefaultPrivileges(tableName, status ? status.value : null));
      }

      options = {
        wait: true,
        patch: !model.isNew()
      };

      currentPermissionValue = model.get(permissionName);
      // attributes['status_id'] = this.selectedState === 'all' ? null : this.selectedState;
      if(currentPermissionValue > 1) {
        attributes[permissionName] = 0;
      } else if(currentPermissionValue == 1) {
        attributes[permissionName] = 2;
      } else {
        attributes[permissionName] = 1;
      }

      options.success = function(model, resp) {
        var tableName = model.get('table_name');
        model.clear();
        model.set(resp.data ? resp.data : resp);
        app.schemaManager.getOrFetchTable(tableName, function(tableModel) {
          app.schemaManager.registerPrivileges([model.toJSON()]);
          app.trigger('tables:change:permissions', tableModel, model);
        });
      };

      model.save(attributes, options);
    },

    editReadFields: function (event) {
      var id = $(event.currentTarget).closest('tr').data('id');
      this.editFields('read', id);
    },

    editWriteFields: function (event) {
      var id = $(event.currentTarget).closest('tr').data('id');
      this.editFields('write', id);
    },

    editFields: function (type, id) {
      var model = this.collection.get(id);

      // @TODO: link real col
      app.router.openViewInModal(new EditFieldsModal({type: type, model: model}));
    },

    permissionTitle: function (model, name) {
      var title, permission;

      permission = 'allow_' + name;
      if (model.get(permission) > 1) {
        title = __t('permissions_can_' + name + '_any_items');
      } else if (model.get(permission) === 1) {
        title = __t('permissions_can_' + name + '_their_items');
      } else if (!model.has(permission)) {
        title = __t('permissions_can_' + name + '_items');
      } else {
        title = __t('permissions_can_not_' + name + '_items');
      }

      return title;
    },

    parsePermissions: function (model) {
      var permissions = [
        // View
        {
          name: 'view',
          view: model.has('allow_view') && model.get('allow_view') > 0,
          bigView: model.has('allow_view') && model.get('allow_view') === 2,
          onlyMine: model.has('allow_view') && model.get('allow_view') === 1,
          cannot: function(model) {
            return !model.has('allow_view') || ! (model.get('allow_view') > 0)
          }(model)
        },
        // Add
        {
          name: 'add',
          title: this.permissionTitle(model),
          add: (model.has('allow_add') && model.get('allow_add') > 0),
          onlyMine: false, // You either can or cannot add items
          cannot: function(model) {
            return !model.has('allow_add') || ! (model.get('allow_add') > 0)
          }(model)
        },
        // Edit
        {
          name: 'edit',
          edit: (model.has('allow_edit') && model.get('allow_edit') > 0),
          bigEdit: (model.has('allow_edit') && model.get('allow_edit') === 2),
          onlyMine: model.has('allow_edit') && model.get('allow_edit') === 1,
          cannot: function(model) {
            return !model.has('allow_edit') || ! (model.get('allow_edit') > 0)
          }(model)
        },
        // Delete
        {
          name: 'delete',
          delete: (model.has('allow_delete') && model.get('allow_delete') > 0),
          bigDelete: (model.has('allow_delete') && model.get('allow_delete') === 2),
          onlyMine: model.has('allow_delete') && model.get('allow_delete') === 1,
          cannot: function(model) {
            return !model.has('allow_delete') || ! (model.get('allow_delete') > 0)
          }(model)
        }
        // Alter
        // {
        //   alter: (model.has('allow_alter') && model.get('allow_alter') > 0),
        // },
      ];

      return permissions.map(function (permission) {
        permission.title = this.permissionTitle(model, permission.name);

        return permission;
      }, this);
    },

    getTables: function () {
      var tables = [];
      var showCoreTables = this.showCoreTables;

      app.schemaManager.getTables().forEach(function (table) {
        var hasPermissions = app.schemaManager.getPrivileges(table.id);

        if (!hasPermissions || (showCoreTables !== true && table.id.indexOf('directus_') === 0)) {
          return false;
        }

        tables.push(table);
      });

      return tables;
    },

    getTablePrivilege: function (table, status) {
      // var privilege = app.schemaManager.getPrivileges(table, status);
      var privilege = this.collection.findWhere({
        table_name: table,
        status_id: status
      });

      if (!privilege) {
        privilege = app.schemaManager.getDefaultPrivileges(table, status);
        this.collection.add(privilege);
      }

      return privilege;
    },

    parsePrivilege: function (privilege) {
      var data = privilege.toJSON();

      data.cid = privilege.cid;
      data.title = app.capitalize(data.table_name, '_', true);
      data.readBlacklist = data.read_field_blacklist || false;
      data.writeBlacklist = data.write_field_blacklist || false;
      // Default permissions
      data.permissions = this.parsePermissions(privilege);

      return data;
    },

    getDefaultStatus: function () {
      return {
        name: 'All',
        value: null
      };
    },

    getStatuses: function (currentStatusId) {
      var statuses = [];

      statuses.push(this.getDefaultStatus());
      _.each(app.statusMapping.mapping, function(status, key) {
        statuses.push({
          name: status.name,
          value: key
        });
      });

      statuses = statuses.filter(function(status) {
        return status.value != currentStatusId;
      });

      return statuses;
    },

    getPermissionsList: function () {
      var permissions = [];
      var tables = this.getTables();

      tables.forEach(_.bind(function (table) {
        var currentTableStatus = this.state.tables[table.id] || this.getDefaultStatus();
        var privilege = this.getTablePrivilege(table.id, currentTableStatus.value);
        var data = this.parsePrivilege(privilege);

        // Has status column?
        data.hasStatusColumn = this.hasStatusColumn(privilege.get('table_name'));
        data.statuses = data.hasStatusColumn ? this.getStatuses(currentTableStatus) : [];
        data.currentStatus = currentTableStatus;

        permissions.push(data);
      }, this));

      return permissions;
    },

    serialize: function() {
      return {
        tables: this.getPermissionsList()
      };
    },

    hasStatusColumn: function(table) {
      var columns = app.schemaManager.getColumns('tables', table);
      var statusColumn;

      // table without columns
      // it means the user doesn't have permission to view them
      // @TODO: Make a way to see the columns to admins
      if (!columns) {
        return false;
      }

      statusColumn = columns.table.get('status_column') || 'active';

      return columns.some(function(model) {
        return model.id === statusColumn;
      });
    },

    toggleTables: function () {
      this.showCoreTables = ! this.showCoreTables;
      this.render();

      return this.showCoreTables;
    },

    initialize: function() {
      this.state = {
        default: 'all',
        status: 'all',
        tables: {}
      };

      this.showCoreTables = false;
      this.listenTo(app, 'tables:change:permissions', this.render);
    }
  });
});
