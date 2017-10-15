define([
  'app',
  'underscore',
  'backbone',
  'core/UIManager',
  'core/edit',
  'core/Modal',
  'helpers/schema',
  'core/notification',
  'core/t'
], function(app, _, Backbone, UIManager, EditView, ModalView, SchemaHelper, Notification, __t) {

  return Backbone.Layout.extend({

    template: 'modal/columns/info',

    events: {
      'change select#dataType': function (e) {
        this.selectedDataType = $(e.target).val();
        this.render();
      },

      'change select#uiType': function (event) {
        var selectedUI = $(event.currentTarget).val();
        var columnName = this.model.get('column_name');
        var columnComment = this.model.get('comment');

        if (this.model.isNew()) {
          this.selectedDataType = null;

          var options = this.model.get('options');
          options.set('id', selectedUI);

          this.model.clear();
          this.model.set({
            column_name: columnName,
            comment: columnComment,
            options: options
          });
        }

        this.selectedUI = selectedUI;

        this.render();
      },

      'change input#columnName': 'onInputNameChange',
      'keypress input#columnName': 'onInputNameChange',
      'focus input#columnName': 'onInputNameChange',
      'textInput input#columnName': 'onInputNameChange',
      'input input#columnName': 'onInputNameChange',

      'change .js-strict-naming': 'onStrictNamingChange',

      'change input#comment': function (e) {
        this.comment =  $(e.target).val();
        this.model.set({comment: this.comment});
      },

      'change input#length': function (e) {
        this.model.set({length: $(e.target).val()});
      },

      'change input#defaultValue': function (e) {
        this.model.set({default_value: $(e.target).val()});
      },

      'change select#relatedTable': function (e) {
        this.model.set({related_table: $(e.target).val()});
        this.render();
      },

      'change #junctionKeyRight': function (e) {
        this.model.set({junction_key_right: $(e.target).val()});
      },

      'change #junctionKeyLeft': function (e) {
        this.model.set({junction_key_left: $(e.target).val()});
      },

      'change #tableJunction': function (e) {
        this.model.set({junction_table: $(e.target).val()});
        this.render();
      },
    },

    // TODO: Add this as a option in all views
    cleanup: function () {
      if (this._isTracking) {
        this.model.resetAttributes();
      }
    },

    save: function () {
      var data = this.$('form').serializeObject();
      var options = {patch: false, wait: true, silent: false};
      var isNew = this.model.isNew();
      var columns = this.model.table.columns;

      if (isNew && columns.get(data.column_name)) {
        Notification.warning(__t('column_x_exists', {
          column_name: data.column_name
        }));
        return;
      }

      if (!this.model.isNew() && this._isTracking) {
        data = this.model.unsavedAttributes();
        options.patch = true;
        this.model.stopTracking();
      }

      options.success = function (model) {
        var type = isNew ? 'created' : 'updated';
        var title = __t('column_' + type);
        var message = __t('column_x_was_' + type, {
          column_name: model.get('column_name')
        });

        Notification.success(title, message, {timeout: 3000});
      };

      if (data) {
        return this.model.save(data, options);
      }

      return true;
    },

    serialize: function () {
      var UIManager = require('core/UIManager');
      var tables;
      var tableRelated;
      var uis = _.clone(UIManager._getAllUIs());

      var data = {
        isNew: this.model.isNew(),
        ui_types: [],
        data_types: [],
        table_name: this.model.table.id,
        column_name: this.model.get('column_name'),
        comment: this.model.get('comment'),
        default_value: this.model.get('default_value'),
        hideColumnName: this.hideColumnName
      };

      this.isAlias = false;

      if (_.isFunction(this.uiFilter)) {
        _.each(uis, function(value, key) {
          if (this.uiFilter(value) !== true) {
            delete uis[key];
          }
        }, this);
      }

      _.each(uis, function (ui, key) {
        if (ui.isInternal) {
          return false;
        }

        // omit system interface if the table already has one
        // except if the select interface is one
        if (key !== this.selectedUI && this.omitInterface(ui)) {
          return false;
        }

        if (!this.selectedUI) {
          this.selectedUI = key;
        }

        data.ui_types.push(key);
      }, this);

      var that = this;
      uis[this.selectedUI].dataTypes.forEach(function(dataType) {
        var item = {title: dataType};
        if (['MANYTOMANY', 'ONETOMANY'].indexOf(dataType) >= 0) {
          item.value = 'ALIAS';
        }

        if (!that.selectedDataType) {
          that.selectedDataType = dataType;
        }

        if (dataType === that.selectedDataType) {
          item.selected = true;
        }

        data.data_types.push(item);
      });

      // Check if the data type needs length
      // ENUM and SET doesn't actually needs a LENGTH,
      // but the "length" value is a list of string separate by comma
      if (SchemaHelper.supportsLength(this.selectedDataType)) {
        data.SHOW_LENGTH = true;

        var changeLength = this.model.isNew() || !this.model.get('length');
        if (changeLength) {
          this.model.set('length', SchemaHelper.getTypeDefaultLength(this.selectedDataType));
        }

        data.length = this.model.getLength();
      } else {
        delete data.length;
        if (this.model.has('length')) {
          this.model.unset('length', {silent: true});
        }
      }

      if (['many_to_one', 'single_file', 'many_to_one_typeahead'].indexOf(this.selectedUI) > -1) {
        data.MANYTOONE = true;
        this.selectedRelationshipType = data.selectedRelationshipType = 'MANYTOONE';
        tableRelated = this.getRelatedTable();//this.model.get('related_table');
        this.model.set({junction_key_right: this.columnName});

        if (this.selectedUI === 'single_file') {
          tables = [{id: 'directus_files', selected: true}];
          tableRelated = 'directus_files';
        } else {
          tables = app.schemaManager.getTables();
          tables = tables.map(function(model) {
            if (!tableRelated) {
              tableRelated = model.id;
              this.model.set({related_table: model.id});
            }
            return {id: model.get('table_name'), selected: (model.id === this.model.get('related_table'))};
          }, this);
        }

        data.columns_right = [{column_name: (this.columnName || __t('this_column')), selected: true}];

        var tableModel = app.schemaManager.getTable(tableRelated);
        data.columns_left = app.schemaManager.getColumns('tables', tableRelated).filter(function(model) {
          return tableModel.get('primary_column') === model.id;
        }, this).map(function(model){
          return {column_name: model.id, selected: (model.id === junctionKeyRight)};
        });

        data.disabledJunctionKeyRight = true;

        data.tables = tables;
      }

      //If Single_file UI, force related table to be directus_files
      if (['single_file', 'multiple_files'].indexOf(this.selectedUI) > -1) {
        this.model.set({related_table: 'directus_files'});
        data.disabledTableRelated = true;
      }

      if (['ONETOMANY', 'MANYTOMANY'].indexOf(this.selectedDataType) > -1) {
        data[this.selectedDataType] = true;
        data.selectedRelationshipType = this.selectedRelationshipType = this.selectedDataType;
        this.isAlias = true;

        tableRelated = this.model.get('related_table');
        var junctionTable = this.model.get('junction_table');
        var junctionKeyRight = this.model.get('junction_key_right');

        // List of junction tables
        tables = app.schemaManager.getTables();
        tables = tables.map(function (model) {
          if (!tableRelated) {
            tableRelated = model.id;
            this.model.set({related_table: model.id});
          }
          return {id: model.get('table_name'), selected: (model.id === this.model.get('related_table'))};
        }, this);

        data.tables = tables;

        if (this.selectedDataType === 'MANYTOMANY') {
          data.junctionTables = _.chain(tables)
            .map(function(model) {
              if(!junctionTable){
                junctionTable = model.id;
                this.model.set({junction_table: model.id});
              }
              return {id: model.id, selected: (model.id === this.model.get('junction_table'))};
            }, this).value();

          if (junctionTable !== undefined) {
            var junctionTables = app.schemaManager.getColumns('tables', junctionTable);
            var junctionTableModel = app.schemaManager.getTable(junctionTable);
            var filterPrimary = function(model) {
              return junctionTableModel.get('primary_column') !== model.id;
            };
            data.junction_columns_left = junctionTables.filter(filterPrimary).map(function(model) {
              return {column_name: model.id, selected: (model.id === this.model.get('junction_key_left'))};
            }, this);
            data.junction_columns_right = junctionTables.filter(filterPrimary).map(function(model) {
              return {column_name: model.id, selected: (model.id === this.model.get('junction_key_right'))};
            }, this);
          }

          // related table primary key
          tableName = this.collection.table.id;
          tableModel = app.schemaManager.getTable(tableName);
          data.columns_right = app.schemaManager.getColumns('tables', tableName).filter(function(model) {
            return true;
          }).map(function(model) {
            return {column_name: model.id, selected: (model.id === this.model.get('junction_key_left'))};
          }, this);

          // current table primary column
          data.columns_left = app.schemaManager.getColumns('tables', tableRelated).filter(function (model) {
            return !model.isAlias();
          }).map(function (model) {
            return {column_name: model.id, selected: (model.id === this.model.get('junction_key_left'))};
          }, this);
        } else {
          if (tableRelated !== undefined) {
            data.columns = app.schemaManager.getColumns('tables', tableRelated).map(function(model) {
              return {column_name: model.id, selected: (model.id === junctionKeyRight)};
            }, this);
          }

          // related table columns
          tableModel = tableModel = app.schemaManager.getTable(tableRelated);
          data.columns_left = app.schemaManager.getColumns('tables', tableRelated).filter(function(model) {
            return tableModel.get('primary_column') !== model.id;
          }, this).map(function(model){
            return {column_name: model.id, selected: (model.id === junctionKeyRight)};
          });

          // This column's table primary key
          var tableName = this.collection.table.id;
          tableModel = app.schemaManager.getTable(tableName);
          data.columns_right = app.schemaManager.getColumns('tables', tableName).filter(function(model) {
            return tableModel.get('primary_column') === model.id;
          }, this).map(function(model){
            return {column_name: model.id, selected: (model.id === junctionKeyRight)};
          });

          // hotfix: make sure the column exists in the junction table schema
          // @TODO: Verify that any other related/junction columns exists
          if (junctionKeyRight === undefined) {
            junctionKeyRight = '';
          }

          if (data.columns.length > 0) {
            var column = _.find(data.columns, function(column) {
              return column.column_name === junctionKeyRight;
            });

            if (column === undefined) {
              column = _.first(data.columns);
            }

            junctionKeyRight = column.column_name;
          }

          this.model.set({junction_key_right: junctionKeyRight});
        }

        this.model.set({relationship_type: this.selectedRelationshipType});
      }

      var dataType = this.selectedDataType;
      if (this.isAlias === true) {
        dataType = 'ALIAS';
      }
      this.model.set({data_type: dataType, ui: this.selectedUI});

      data.isAlias = this.isAlias;
      data.isRelational = data.MANYTOONE || data.MANYTOMANY || data.ONETOMANY || false;

      data.isStrictNaming = this.options.strictNaming;
      data.isValidName = this.isValidName();
      data.selectedRelationshipType = this.selectedRelationshipType;

      var uiChanged = !this.model.isNew() && this.selectedUI != this.model._originalAttrs['ui'];
      var hasOptions = UIManager.hasOptions(this.selectedUI);

      data.showOptions = !this.model.isNew() && hasOptions && !uiChanged;
      data.interfaces = this.getInterfacesGrouped(data.ui_types, this.selectedUI);
      data.showDefaultValue = !data.isAlias && !this.model.isPrimaryColumn();

      return data;
    },

    omitInterface: function (ui) {
      var structure = this.model.collection;
      var foundInternal = false;

      structure.each(function (column) {
        if (column.get('ui') === ui.id && ui.isSystem) {
          foundInternal = true;
        }
      });

      return foundInternal;
    },

    getInterfacesGrouped: function (uis, selectedUI) {
      var interfaces = UIManager.getAllUIsGrouped(uis);

      _.each(interfaces, function (group, name) {
        _.each(group, function (ui, id) {
          interfaces[name][id].selected = selectedUI === ui.id;
        });
      });

      return interfaces;
    },

    isValid: function () {
      return this.model.has('column_name');
    },

    isValidName: function () {
      var isValid = this.isValid();

      if (!this.options.strictNaming && !this.options.isColumnNameClean) {
        isValid = false;
      }

      return isValid;
    },

    getRelatedTable: function () {
      var relatedTable = this.model.get('related_table');

      if (relatedTable) {
        return relatedTable;
      }

      // List of junction tables
      var tables = app.schemaManager.getTables();
      tables.each(function (model) {
        if (!relatedTable) {
          relatedTable = model.id;
        }
      }, this);

      return relatedTable;
    },

    isCleanName: function (name, cleanName) {
      return name && name === cleanName;
    },

    onInputNameChange: function (event) {
      var input = event.currentTarget;
      var name = $(input).val();
      var start = input.selectionStart;
      var end = input.selectionEnd;

      this.updateColumnNameWith(name);

      input.setSelectionRange(start, end);
    },

    updateColumnNameWith: function (name) {
      var cleanName = SchemaHelper.cleanColumnName(name);

      this.columnName = this.options.strictNaming ? cleanName : name;
      this.model.set({column_name: this.columnName});

      this.options.isColumnNameClean = this.isCleanName(this.columnName, cleanName);

      this.updateCleanColumnInput();
      this.updateStrictNamingCheck(this.isValidName());
    },

    onStrictNamingChange: function () {
      this.toggleStrictNamingCheck();
    },

    toggleStrictNamingCheck: function () {
      // var $el = this.$('#columnNameValid');
      var $input = this.$('input#columnName');

      // toggle (hide/show) valid/check symbol
      this.options.strictNaming = !this.options.strictNaming;
      // $el.toggle();

      this.updateColumnNameWith($input.val());
      this.updateStrictNamingCheck(this.isValidName());
    },

    updateStrictNamingCheck: function (value) {
      var $el = this.$('#columnNameValid');

      if (value) {
        $el.show();
      } else {
        $el.hide();
      }
    },

    updateCleanColumnInput: function () {
      this.$('#displayName').val(app.capitalize(this.columnName));
      this.$('#columnName').val(this.columnName);
    },

    afterRender: function () {
      this.updateCleanColumnInput();
      this.$('#columnName').focus();
    },

    _alternativeInterfaces: function () {
      var uis = UIManager.getAllSettings({returnObject: true});
      var model = this.model;
      var dataType = model.isAlias() && model.isRelational() ? model.getRelationshipType() : model.get('type');
      var row = model.toJSON();
      var types = [];

      // Gather a list of UI alternatives
      _.each(uis, function (ui) {
        if (row.ui === ui.id || (!ui.system && ui.dataTypes.indexOf(dataType) > -1)) {
          types.push({id: ui.id, selected: (ui.id === row.ui)});
        }
      });

      return types;
    },

    _alternativeInterfacesFilter: function (ui) {
      if (this.model.isNew()) {
        return true;
      }

      var types = this._alternativeInterfaces();

      return !!_.findWhere(types, {id: ui.id});
    },

    initialize: function (options) {
      options = options || {};
      this.uiFilter = options.ui_filter || this._alternativeInterfacesFilter || false;
      this.selectedUI = _.isString(this.model.get('ui')) ? this.model.get('ui') : undefined;
      this.selectedDataType = this.model.get('type') || undefined;
      this.selectedRelationshipType = this.model.get('relationship_type') || undefined;
      this.isAlias = ['ONETOMANY', 'MANYTOMANY'].indexOf(this.selectedRelationshipType) >= 0;
      if (this.isAlias) {
        this.selectedDataType = this.selectedRelationshipType;
      }
      this.columnName = this.model.get('column_name') || undefined;
      this.hideColumnName = (options.hiddenFields && options.hiddenFields.indexOf('column_name') >= 0);

      // Strict naming is true by default
      this.options.strictNaming = true;
      this.options.isColumnNameClean = false;
      // If editing a column, we need to verify whether the column is "clean".
      if (this.columnName) {
        this.isCleanName(this.columnName, SchemaHelper.cleanColumnName(this.columnName));
      }

      this._isTracking = false;
      if (!this.model.isNew() && !this.model._trackingChanges) {
        this._isTracking = true;
        this.model.startTracking();
      }

      this.render();
    }
  });
});
