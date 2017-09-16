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
  './modals/table-new'
], function(app, _, Backbone, Directus, EditView, BasePageView, TableModel, ColumnModel, UIManager, Widgets, SchemaManager, Sortable, Notification, DoubleConfirmation, __t, SchemaHelper, TableNewModal) {

  'use strict';

  var SettingsTables = app.module();
  var confirmDestroyTable = function (tableName, callback, options) {
    var type;

    if (_.isBoolean(options)) {
      options = {
        unmanage: options
      }
    }

    options = options || {};
    type = options.unmanage !== true ? 'delete' : 'unmanage';

    DoubleConfirmation({
      value: tableName,
      emptyValueMessage: __t('invalid_table'),
      firstQuestion: __t('question_' + type + '_this_table'),
      secondQuestion: __t('question_delete_this_table_confirm', {table_name: tableName}),
      notMatchMessage: __t('table_name_did_not_match'),
      callback: callback
    }, this);
  };

  var unmanageTable = function (model, callback) {
    destroyTable(model, callback, {unmanage: true});
  };

  var destroyTable = function (model, callback, options) {
    options = options || {};

    if (options.wait === undefined) {
      options.wait = true;
    }

    options.success = function (model, response) {
      if (response.success !== true) {
        Notification.error(response.message);

        return;
      }

      var tableName = model.get('table_name');
      var bookmarks = app.router.bookmarks;

      app.schemaManager.unregisterFullSchema(tableName);
      if (options.unmanage === true) {
        app.schemaManager.registerTable({schema: model.toJSON()});
        model.trigger('sync', model, response, options);
      }

      var bookmark = bookmarks.findWhere({title: app.capitalize(tableName), section: 'table'});
      if (bookmark) {
        bookmarks.remove(bookmark);
      }

      Notification.success(__t('table_removed'), __t('table_x_was_removed', {
        table_name: tableName
      }), 3000);

      if (callback) {
        callback();
      }
    };

    if (options.unmanage !== true) {
      model.destroy(options);
    } else {
      var unmanageOptions = _.clone(options);

      unmanageOptions.success = function (response) {
        return options.success(model, response, options);
      };

      app.request('delete', _.result(model, 'url') + '/unmanage', unmanageOptions);
    }
  };

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

  SettingsTables.Views.Table = EditView.extend({
    getHeaderOptions: function() {
      var options = EditView.prototype.getHeaderOptions.apply(this, arguments);

      return _.extend(options, {
        route: {
          title: this.model.id,
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

      _.each(model.changed, function (value, attr) {
        app.trigger('tables:change:attributes', model, attr);
        app.trigger('tables:change:attributes:' + attr, model, attr);
      });

      // TODO: clean this into a factory or similar
      table.set(resp.data, {parse: true});
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

    addRowView: function (model, render) {
      var view = this.insertView('tbody', new TablesRow({
        model: model,
        unregistered: ! app.schemaManager.hasPrivilege(model.id)
      }));

      if (render !== false) {
        view.render();
      }
    },

    getPrevTableId: function (tableIndex) {
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

    moveRowView: function (model) {
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

    isValidModel: function (model) {
      // Filter out _directus tables
      return (model.id.substring(0,9) !== 'directus_');
    },

    flashItem: function (entryID, bodyScrollTop) {
      document.body.scrollTop = parseInt(bodyScrollTop, 10) || 0;
      app.on('load', function() {
        if(entryID) {
          this.$el.find('tr[data-id="' + entryID + '"]').flashRow();
        }
      }, this);
    },

    serialize: function () {
      return {
        isEmpty: !this.hasUserTables()
      }
    },

    beforeRender: function () {
      this.collection.sort();
      this.collection.each(function (model) {
        if (!this.isValidModel(model)) {
          return false;
        }
        this.addRowView(model, false);
      }, this);
    },

    hasUserTables: function () {
      return this.collection.getUserTables().length > 0;
    },

    initialize: function () {
      this.listenTo(this.collection, 'add', function (model) {
        if (this.collection.getUserTables().length === 1) {
          this.render();
        } else {
          this.addRowView(model);
          this.moveRowView(model);
        }
      });

      this.listenTo(this.collection, 'remove', function () {
        if (!this.hasUserTables()) {
          this.render();
        }
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

      'click .js-add-table': 'confirmManageTable',

      'click .js-unmanage-table': 'confirmUnManageTable'
    },

    confirmManageTable: function (event) {
      event.stopPropagation();

      var cb = function () {
        var $row = $(event.target).closest('tr');
        this.manageTable($row.data('id'));
      };

      app.router.openModal({type: 'confirm', text: __t('confirm_manage_table'), callback: _.bind(cb, this)});
    },

    confirmUnManageTable: function (event) {
      event.stopPropagation();

      var $row = $(event.target).closest('tr');
      var tableName = $row.data('id');

      confirmDestroyTable(tableName, _.bind(this.unManageTable, this), {unmanage: true});
    },

    manageTable: function (tableName) {
      // TODO: Change this process to an dedicated add table method
      // similar to unmanage table
      app.schemaManager.addTable(tableName, function(tableModel) {
        app.router.bookmarks.addTable(tableModel);
        app.router.go(['settings', 'tables', tableName]);
      });
    },

    toggleTableAttribute: function (tableModel, attr, element) {
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

    unManageTable: function () {
      unmanageTable(this.model, _.bind(this.remove, this));
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
