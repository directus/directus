define(['app', 'underscore', 'backbone', 'core/t', 'core/Modal'], function(app, _, Backbone, __t, ModalView) {

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/permissions-fields',

    events: {
      'click .js-select-column': function(event) {
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
      }
    },

    hasColumn: function(name) {
      var blacklist = (this.model.get(this.name + '_field_blacklist') || '').split(',');

      return blacklist.indexOf(name) >= 0;
    },

    serialize: function() {
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

    initialize: function(options) {
      this.name = options.type;
      this.render();
    }
  });

  var EditFieldsModal = ModalView.extend({
    beforeRender: function() {
      this.setView('.modal-bg', this.view);
    },

    initialize: function(options) {
      this.view = new EditFields(options);
    }
  });

  return Backbone.Layout.extend({
    prefix: 'app/core/uis/permissions/',

    template: 'table',

    events: {
      'click .js-status-toggle': 'toggleStatusSelector',
      'click .js-status': 'changeStatus',
      'click .js-permission-toggle': 'togglePermission',
      'click .js-write.choose-column-blacklist': 'editWriteFields',
      'click .js-read.choose-column-blacklist': 'editReadFields'
    },

    toggleStatusSelector: function(event) {
      var $row = $(event.currentTarget).parent();
      var id = $row.data('id');
      var model = this.collection.get(id);

      if (!this.hasStatusColumn(model.get('table_name'))) {
        return;
      }

      $row.toggleClass('workflow-enabled');
    },

    changeStatus: function(event) {
      var $el = $(event.currentTarget);
      var value = $el.data('value');
      var $row = $el.closest('tr');
      var tableName = $row.data('table-name');
      var state = {
        name: 'All',
        value: null
      };

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

    togglePermission: function(event) {
      var $toggle = $(event.currentTarget);
      var permission = $toggle.closest('td').data('name');
      var permissionName = 'allow_' + permission;
      var $row = $toggle.closest('tr');
      var model = this.collection.get($row.data('id'));
      var attributes = {};
      var currentPermissionValue;
      var options = {patch: true, wait: false};

      // @note: temporary empty privileges
      if (!model) {
        model = this.collection.at(0).clone();
        model.clear();
        model.set(app.schemaManager.getDefaultPrivileges('articles', 1));
      }

      currentPermissionValue = model.get(permissionName);
      // attributes['status_id'] = this.selectedState === 'all' ? null : this.selectedState;
      if(currentPermissionValue > 1) {
        attributes[permissionName] = 0;
      } else if(currentPermissionValue == 1) {
        attributes[permissionName] = 2;
      } else {
        attributes[permissionName] = 1;
      }

      options.success = function(model) {
        var tableName = model.get('table_name');
        app.schemaManager.getOrFetchTable(tableName, function(tableModel) {
          app.schemaManager.registerPrivileges([model.toJSON()]);
          app.trigger('tables:change:permissions', tableModel, model);
        });
      };

      model.save(attributes, options);
    },

    editReadFields: function(event) {
      var id = $(event.currentTarget).closest('tr').data('id');
      this.editFields('read', id);
    },

    editWriteFields: function(event) {
      var id = $(event.currentTarget).closest('tr').data('id');
      this.editFields('write', id);
    },

    editFields: function(type, id) {
      var model = this.collection.get(id);

      // @TODO: link real col
      app.router.openViewInModal(new EditFieldsModal({type: type, model: model}));
    },

    permissionTitle: function(model, name) {
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

    parsePermissions: function(model) {
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

      return permissions.map(function(permission) {
        permission.title = this.permissionTitle(model, permission.name);

        return permission;
      }, this);
    },

    serialize: function() {
      var collection = this.collection;
      var that = this;

      // collection = collection.filter(function(model) {
      //   if (that.selectedState !== 'all') {
      //     var test = app.schemaManager.getColumns('tables', model.get('table_name'));
      //     if(test) {
      //       test = test.find(function(hat){return hat.id === app.statusMapping.status_name;});
      //       if(test) {
      //         return true;
      //       }
      //     }
      //     return false;
      //   }
      //   return true;
      // });
      //
      // var tableStatusMapping = {};
      //
      // collection.forEach(function(priv) {
      //   if(!tableStatusMapping[priv.get('table_name')]) {
      //     tableStatusMapping[priv.get('table_name')] = {count: 0};
      //   }
      //   if(priv.get('status_id')) {
      //     tableStatusMapping[priv.get('table_name')][priv.get('status_id')] = priv;
      //   } else {
      //     tableStatusMapping[priv.get('table_name')][that.selectedState] = priv;
      //   }
      //
      //   if(!tableStatusMapping[priv.get('table_name')][that.selectedState]) {
      //     tableStatusMapping[priv.get('table_name')][that.selectedState] = priv;
      //   }
      //
      //   tableStatusMapping[priv.get('table_name')].count++;
      // });
      //
      // // Create data structure suitable for view
      // collection = [];
      //
      // for (var prop in tableStatusMapping) {
      //   collection.push(tableStatusMapping[prop][this.selectedState]);
      // }

      // if (this.selectedState !== 'all') {
      //   collection.push({
      //
      //   })
      // }

      collection = collection.filter(_.bind(function(model) {
        // take system tables out
        // @TODO: use a list of actual core tables.
        if (that.showCoreTables !== true && model.get('table_name').indexOf('directus_') === 0) {
          return false;
        }

        var selectedStatusId = null;
        if (this.state.tables[model.get('table_name')]) {
          selectedStatusId = this.state.tables[model.get('table_name')].value;
        }

        return (model.get('status_id') === selectedStatusId);
      }, this));

      var tables = app.schemaManager.getTables();
      tables.forEach(_.bind(function(table) {
        if (that.showCoreTables !== true && table.id.indexOf('directus_') === 0) {
          return false;
        }

        var attributes = {
          table_name: table.id
        };

        if (!this.state.tables[table.id]) {
          return;
        }

        var selectedStatusId = this.state.tables[table.id].value;
        var privileges = _.find(collection, function(model) {
          return model.table_name === table.id;
        });

        if (!privileges) {
          collection.push(app.schemaManager.getDefaultPrivileges(table.id, selectedStatusId));
        }
      }, this));

      var tableData = [];
      collection.forEach(_.bind(function(model) {
        var data, statuses = [], defaultStatus;

        data = model.toJSON();
        data.cid = model.cid;
        data.title = app.capitalize(data.table_name, '_', true);
        data.readBlacklist = data.read_field_blacklist || false;
        data.writeBlacklist = data.write_field_blacklist || false;
        // Default permissions
        data.permissions = that.parsePermissions(model);

        // Has status column?
        data.hasStatusColumn = this.hasStatusColumn(model.get('table_name'));

        defaultStatus = {
          name: 'All',
          value: null
        };

        statuses.push(defaultStatus);
        _.each(app.statusMapping.mapping, function(status, key) {
          statuses.push({
            name: status.name,
            value: key
          });
        });

        data.currentStatus = this.state.tables[model.get('table_name')] || defaultStatus;
        data.statuses = statuses.filter(function(status) {
          return status.value != data.currentStatus.value;
        });

        tableData.push(data);
      }, this));

      return {tables: tableData};
    },

    hasStatusColumn: function(table) {
      var columns = app.schemaManager.getColumns('tables', table);
      var statusColumn = columns.table.get('status_column') || 'active';

      return columns.some(function(model) {
        return model.id === statusColumn;
      });
    },

    initialize: function() {
      this.selectedState = 'all';
      this.state = {
        default: 'all',
        tables: {}
      };
      this.showCoreTables = false;
      this.collection.on('change', this.render, this);
    }
  });
});
