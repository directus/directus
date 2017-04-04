//  tables.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'underscore',
  'backbone',
  'core/directus',
  'modules/tables/views/EditView',
  'core/BasePageView',
  'schema/TableModel',
  'schema/ColumnModel',
  'core/UIManager',
  'core/widgets/widgets',
  'schema/SchemaManager',
  'sortable',
  'core/notification',
  'core/doubleConfirmation',
  'core/t',
  'helpers/schema',
  './modals/table-new',
  '../SettingsConfig'
], function(app, _, Backbone, Directus, EditView, BasePageView, TableModel, ColumnModel, UIManager, Widgets, SchemaManager, Sortable, Notification, DoubleConfirmation, __t, SchemaHelper, TableNewModal, SettingsConfig) {

  'use strict';

  var SettingsTables = app.module();
  var confirmDestroyTable = function (tableName, callback) {
    DoubleConfirmation({
      value: tableName,
      emptyValueMessage: __t('invalid_table'),
      firstQuestion: __t('question_delete_this_table'),
      secondQuestion: __t('question_delete_this_table_confirm', {table_name: tableName}),
      notMatchMessage: __t('table_name_did_not_match'),
      callback: callback
    }, this);
  };

  var destroyTable = function (model, callback) {
    var options = {
      wait: true
    };

    options.success = function(model, response) {
      if (response.success === true) {
        var tableName = model.get('table_name');
        var bookmarks = app.router.bookmarks;

        app.schemaManager.unregisterFullSchema(tableName);

        var model = bookmarks.findWhere({title: app.capitalize(tableName), section: 'table'});
        if (model) {
          bookmarks.remove(model);
        }

        Notification.success(__t('table_removed'), __t('table_x_was_removed', {
          table_name: tableName
        }), 3000);

        if (callback) {
          callback();
        }
      } else {
        Notification.error(response.message);
      }
    };

    model.destroy(options);
  };

  // Handles new columns and aliases.
  // Rendered inside modal
  var NewColumnOverlay = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('new_field'),
        isOverlay: true
      }
    },

    leftToolbar: function() {
      var self = this;

      return  [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'check',
            buttonClass: 'primary',
            buttonText: __t('save')
          },
          onClick: function(event) {
            self.save();
          }
        })
      ];
    },

    save: function() {
      this.model.set({comment: ''});
      if(this.contentView.isValid()) {
        var that = this;
        this.model.save({},{success: function(data) {
          that.model.set(data.toJSON());
          that.model.url = app.API_URL + 'tables/' + that.collection.table.id + '/columns/' + data.get('id') + '/';
          app.router.removeOverlayPage(that); //, {title: 'Add new column', stretch: true}
          that.collection.add(that.model);
          that.collection.trigger('change');

          // Verify whether the UI requires options to be set
          // in order to work.
          var ui = UIManager._getUI(data.options.get('id'));
          if (ui.requireVariables === true) {
            openFieldUIOptionsView(data);
          }
        }});
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.contentView);
    },

    initialize: function(options) {
      this.contentView = new NewColumn(options);
    }
  });

  var NewColumn = Backbone.Layout.extend({

    tagName: "form",

    attributes: {
      class: "two-column-form"
    },

    template: 'modules/settings/settings-columns-add',

    events: {
      'change select#dataType': function(e) {
        this.selectedDataType = $(e.target).val();
        this.render();
      },
      'change select#uiType': function(e) {
        var columnName = this.model.get('column_name');
        this.model.clear();
        this.model.set({column_name: columnName});
        this.selectedUI = $(e.target).val();
        this.selectedDataType = null;
        this.render();
      },
      'change input#columnName': function(e) {
        this.columnName =  $(e.target).val();
        this.model.set({column_name: this.columnName});
      },
      'change input#charLength': function(e) {
        this.model.set({char_length: $(e.target).val()});
      },
      'change select#related_table': function(e) {
        this.model.set({related_table: $(e.target).val()});
        this.render();
      },
      'change #junction_key_right': function(e) {
        this.model.set({junction_key_right: $(e.target).val()});
      },
      'change #junction_key_left': function(e) {
        this.model.set({junction_key_left: $(e.target).val()});
      },
      'change #table_junction': function(e) {
        this.model.set({junction_table: $(e.target).val()});
        this.render();
      }
    },

    serialize: function() {
      var tables;
      var tableRelated;
      var uis = _.clone(UIManager._getAllUIs());
      var data = {
        ui_types: [],
        data_types: [],
        column_name: this.model.get('column_name'),
        hideFieldName: this.hideFieldName
      };

      if (_.isFunction(this.uiFilter)) {
        _.each(uis, function(value, key) {
          if (this.uiFilter(value) !== true) {
            delete uis[key];
          }
        }, this);
      }

      for(var key in uis) {
        //If not system column
        if(key.indexOf('directus_') < 0 ) {
          if(!this.selectedUI) {
            this.selectedUI = key;
          }

          var item = {title: key};

          if(this.selectedUI === key) {
            item.selected = true;
          }

          data.ui_types.push(item);
        }
      }

      data.ui_types.sort(function(a, b) {
        if (a.title < b.title)
          return -1
        if (a.title > b.title)
          return 1
        return 0
      });

      var that = this;

      uis[this.selectedUI].dataTypes.forEach(function(dataType) {
        var item = {title: dataType};
        if (['MANYTOMANY', 'ONETOMANY'].indexOf(dataType) >= 0) {
          item.value = 'ALIAS';
        }

        if (!that.selectedDataType) {
          that.selectedDataType = dataType;
        }

        if(dataType === that.selectedDataType) {
          item.selected = true;
        }

        data.data_types.push(item);
      });

      // Check if the data type needs length
      // ENUM and SET doesn't actually needs a LENGTH,
      // but the "length" value is a list of string separate by comma
      if (['VARCHAR', 'CHAR', 'ENUM', 'SET'].indexOf(this.selectedDataType) > -1) {
        data.SHOW_CHAR_LENGTH = true;
        if (!this.model.get('char_length')) {
          var charLength = ['ENUM', 'SET'].indexOf(this.selectedDataType) > -1 ? '' : 100;
          this.model.set({char_length: charLength});
        }
        data.char_length = this.model.get('char_length');
      } else {
        delete data.char_length;
        if(this.model.has('char_length')) {
          this.model.unset('char_length', {silent: true});
        }
      }

      if (['many_to_one', 'single_file', 'many_to_one_typeahead'].indexOf(this.selectedUI) > -1) {
        data.MANYTOONE = true;
        tableRelated = this.model.get('related_table');
        this.model.set({junction_key_right: this.columnName});

        if (this.selectedUI === 'single_file') {
          tables = [{id: 'directus_files', selected: true}];
        } else {
          tables = app.schemaManager.getTables();
          tables = tables.map(function(model) {
            if(!tableRelated) {
              tableRelated = model.id;
              this.model.set({related_table: model.id});
            }
            return {id: model.get('table_name'), selected: (model.id === this.model.get('related_table'))};
          }, this);
        }

        data.columns_right = [{column_name: (this.columnName || __t('this_column')), selected: true}];
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

        if(this.selectedDataType === 'MANYTOMANY') {
          data.junctionTables = _.chain(tables)
            .map(function(model) {
              if(!junctionTable){
                junctionTable = model.id;
                this.model.set({junction_table: model.id});
              }
              return {id: model.id, selected: (model.id === this.model.get('junction_table'))};
            }, this).value();

          if (junctionTable !== undefined) {
            data.columns_left = app.schemaManager.getColumns('tables', junctionTable).map(function(model) {
              return {column_name: model.id, selected: (model.id === this.model.get('junction_key_left'))};
            }, this);
            data.columns_right = app.schemaManager.getColumns('tables', junctionTable).map(function(model) {
              return {column_name: model.id, selected: (model.id === this.model.get('junction_key_right'))};
            }, this);
          }
        } else {
          if (tableRelated !== undefined) {
            data.columns = app.schemaManager.getColumns('tables', tableRelated).map(function(model) {
              return {column_name: model.id, selected: (model.id === junctionKeyRight)};
            }, this);
          }

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

        this.model.set({relationship_type: this.selectedDataType});
      }

      var dataType = this.selectedDataType;
      if (this.isAlias === true) {
        dataType = 'ALIAS';
      }
      this.model.set({data_type: dataType, ui: this.selectedUI});

      data.isAlias = this.isAlias;

      return data;
    },

    isValid: function() {
      if(this.model.get('column_name')) {
        return true;
      }

      return false;
    },

    afterRender: function() {
      var $el = this.$el;
      var $inputColumnName = $el.find('input#columnName');
      $inputColumnName.on('change keypress paste focus textInput input', function() {
        var rawColumnName = $(this).val();
        var cleanColumnName = SchemaHelper.cleanColumnName(rawColumnName);
        var columnNameText = '';

        if (cleanColumnName && rawColumnName !== cleanColumnName) {
          columnNameText = __t('this_column_will_be_saved_as_x', {column_name: cleanColumnName});
        }

        $el.find('#cleanColumnName').text(columnNameText);
      });
    },

    initialize: function(options) {
      options = options || {};
      this.uiFilter = options.ui_filter || false;
      this.selectedUI = _.isString(this.model.get('ui')) ? this.model.get('ui') : undefined;
      this.selectedDataType = this.model.get('type') || undefined;
      this.selectedRelationshipType = this.model.get('relationship_type') || undefined;
      this.isAlias = ['ONETOMANY', 'MANYTOMANY'].indexOf(this.selectedRelationshipType) >= 0;
      if (this.isAlias) {
        this.selectedDataType = this.selectedRelationshipType;
      }
      this.columnName = this.model.get('column_name') || undefined;
      this.hideFieldName = (options.hiddenFields && options.hiddenFields.indexOf('field_name') >= 0);

      this.render();
    }
  });

  var EditColumn = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'UI Settings',
        isOverlay: true
      }
    },

    leftToolbar: function() {
      var self = this;
      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: true
        },
        onClick: function(event) {
          self.save();
        }
      });

      return [
        this.saveWidget
      ];
    },

    save: function() {
      console.log("Save");
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
    },

    initialize: function(options) {
      this.table = new Directus.EditView({model: this.model, structure: this.options.schema});
    }
  });

  var EditRelationship = NewColumnOverlay.extend({
    headerOptions: {
      route: {
        title: __t('relationship_settings'),
        isOverlay: true
      }
    }
  });

  SettingsTables.Views.Table = EditView.extend({
    getHeaderOptions: function() {
      var options = EditView.prototype.getHeaderOptions.apply(this, arguments);

      return _.extend(options, {
        route: {
          breadcrumbs: [
            {title: __t('settings'), anchor: '#settings'},
            {title: __t('tables_and_inputs'), anchor: '#settings/tables'}
          ]
        },
        basicSave: true,
        className: 'header settings'
      });
    },

    deleteConfirm: function () {
      var self = this;
      confirmDestroyTable(this.model.get('name'), function () {
        destroyTable(self.model, function () {
          app.router.go(['settings', 'tables']);
        });
      });
    },

    rightPane: false,

    syncTableInformation: function (model, resp) {
      var table = app.schemaManager.getTable(model.get('table_name'));

      // @todo: clean this into a factory or similar
      table.set(resp, {parse: true});
      table.columns.reset(resp.data.columns.toJSON(), {parse: true, table: table});
      model.table = table;
    },

    initialize: function (options) {
      options.onSuccess = this.syncTableInformation;
      EditView.prototype.initialize.apply(this, arguments);
    }
  });

  var Tables = Backbone.Layout.extend({

    template: 'modules/settings/settings-tables',

    events: {
      'click .js-row': function (event) {
        var tableName = $(event.currentTarget).data('id');

        // only go to table details if it already has permissions set
        if (app.schemaManager.hasPrivilege(tableName)) {
          app.router.go(['settings', 'tables', tableName]);
        }
      }
    },

    addRowView: function(model, render) {
      var view = this.insertView('tbody', new TablesRow({
        model: model,
        unregistered: ! app.schemaManager.hasPrivilege(model.id)
      }));

      if (render !== false) {
        view.render();
      }
    },

    getPrevTableId: function(tableIndex) {
      if (tableIndex < 0) {
        tableIndex = 0;
      } else if (tableIndex > this.collection.length) {
        tableIndex = this.collection.length;
      }

      var model = this.collection.at(tableIndex);
      if (tableIndex === 0 || tableIndex === this.collection.length) {
        return model.id;
      }

      if (model.id.substring(0,9) === 'directus_') {
        return this.getPrevTableId(tableIndex-1);
      }

      return model.id;
    },

    moveRowView: function(model) {
      var currentModelIndex = this.collection.indexOf(model);
      var afterModelIndex = currentModelIndex-1;
      var tbody = this.$el.find('tbody');
      var tableId = model.id || false;
      // Get the previous table Id, ignoring `directus_` tables
      var prevTableId = this.getPrevTableId(afterModelIndex);

      if (tableId) {
        var currentRow = tbody.find('[data-id="'+tableId+'"]');
        var afterRow = tbody.find('[data-id="'+prevTableId+'"]');
        var currentRowIndex = currentRow.index();

        if(currentModelIndex === 0) {
          currentRow.prependTo(tbody);
        } else {
          currentRow.insertAfter(afterRow);
        }
      }
    },

    isValidModel: function(model) {
      // Filter out _directus tables
      return (model.id.substring(0,9) !== 'directus_');
    },

    flashItem: function(entryID, bodyScrollTop) {
      document.body.scrollTop = parseInt(bodyScrollTop, 10) || 0;
      app.on('load', function() {
        if(entryID) {
          this.$el.find('tr[data-id="' + entryID + '"]').flashRow();
        }
      }, this);
    },

    beforeRender: function() {
      this.collection.sort();
      this.collection.each(function(model) {
        if (!this.isValidModel(model)) {
          return false;
        }
        this.addRowView(model, false);
      }, this);
    },

    initialize: function() {
      this.listenTo(this.collection, 'add', function(model) {
        this.addRowView(model);
        this.moveRowView(model);
      });
      this.listenTo(app.router.v.main, 'flashItem', this.flashItem);
    }
  });

  var TablesRow = Backbone.Layout.extend({

    template: 'modules/settings/settings-tables-rows',

    tagName: 'tr',

    attributes: function () {
      var classes = ['js-row'];

      if (this.unregistedTable) {
        classes.push('not-managed');
      }

      return {
        'class': classes.join(' '),
        'data-id': this.model.get('table_name')
      };
    },

    events: {
      // 'click td span': function(e) {
      //   e.stopImmediatePropagation();
      //   var attr = $(e.target).closest('td').attr('data-attribute');
      //
      //   this.toggleTableAttribute(SchemaManager.getTable($(e.target).closest('tr').attr('data-id')), attr, $(e.target));
      // },

      'click .js-add-table': function (event) {
        event.stopPropagation();

        var $row = $(event.target).closest('tr');
        var tableName = $row.data('id');

        app.schemaManager.addTable(tableName, function(tableModel) {
          app.router.bookmarks.addTable(tableModel);
          app.router.go(['settings', 'tables', tableName]);
        });
      },

      'click .js-remove-table': function (event) {
        event.stopPropagation();

        var tableName = $(event.target).closest('tr').data('id') || this.model.get('table_name');

        confirmDestroyTable(tableName, _.bind(this.destroyTable, this));
      }
    },

    toggleTableAttribute: function(tableModel, attr, element) {
      var data = {};

      data[attr] = !tableModel.get(attr);
      tableModel.save(data);

      app.trigger('tables:change:attributes', tableModel, attr);
      app.trigger('tables:change:attributes:' + attr, tableModel, attr);

      if(element.hasClass('add-color')) {
        element.addClass('delete-color');
        element.removeClass('add-color');
        element.removeClass('on');
      } else {
        element.addClass('add-color');
        element.removeClass('delete-color');
        element.addClass('on');
      }
    },

    destroyTable: function() {
      destroyTable(this.model, _.bind(this.remove, this));
    },

    serialize: function() {
      var data = this.model.toJSON();
      data.unregisteredTable = this.unregistedTable;

      return data;
    },

    constructor: function (options) {
      this.unregistedTable = options.unregistered === true;
      this.parentView = options.parent;

      Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });

  SettingsTables.Views.List = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('tables_and_inputs'),
        breadcrumbs: [{title: __t('settings'), anchor: '#settings'}]
      },
      className: 'header settings'
    },

    leftToolbar: function () {
      if(!this.widgets.addWidget) {
        var self = this;
        this.widgets.addWidget = new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('add')
          },
          onClick: _.bind(self.addTableConfirmation, self)
        });
      }
      return [this.widgets.addWidget];
    },

    beforeRender: function () {
      this.setView('#page-content', new Tables({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    },

    initialize: function () {
      this.widgets = {};
    },

    addTableConfirmation: function () {
      app.router.openViewInModal(new TableNewModal());
    }
  });

  function openFieldUIOptionsView(column) {
    var model = column.options;
    model.set({id: column.get('ui')});
    var schema = app.schemaManager.getColumns('ui', model.id);
    model.structure = schema;
    var view = new EditColumn({model: model, schema: schema});
    app.router.openUserModal(view);
    view.save = function() {
      model.save(view.table.data(), {success: function() {
        view.close();
      }});
    };

    // hotfix: The server returns 404 not found when the ui settings are not set yet.
    // this cause the model to get error attributes as ui options
    model.fetch({
      // errorPropagation stop the application to catch this error and handle them as actual error
      errorPropagation: false,
      // edit module expect a sync event to render the page
      error: function() {
        model.trigger('sync', model);
      }
    });
  }

  return SettingsTables;
});
