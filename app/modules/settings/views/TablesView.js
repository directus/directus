//  tables.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus',
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
  '../SettingsConfig'
],

function(app, Backbone, Directus, BasePageView, TableModel, ColumnModel, UIManager, Widgets, SchemaManager, Sortable, Notification, DoubleConfirmation, __t, SchemaHelper, SettingsConfig) {
  "use strict";

  var SettingsTables = app.module();

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
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "check", buttonClass: "", buttonText: __t('save_item')}})
      ];
    },

    events: {
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      },
      'click #addBtn': function() {
        this.save();
      }
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
      this.contentView = new NewColumn({model: this.model});
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
      'change select#table_related': function(e) {
        this.model.set({table_related: $(e.target).val()});
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
      var data = {ui_types: [], data_types: [], column_name: this.model.get('column_name')};
      var uis = UIManager._getAllUIs();

      for(var key in uis) {
        //If not system column
        if(key.indexOf('directus_') < 0 ) {
          if(!this.selectedUI) {
            this.selectedUI = key;
          }

          var item = {title: key};

          if(this.selectedUI == key) {
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
        if(!that.selectedDataType) {
          that.selectedDataType = dataType;
        }

        if(dataType == that.selectedDataType) {
          item.selected = true;
        }

        data.data_types.push(item);
      });

      //Check if we need length field
      if(['VARCHAR', 'CHAR', 'ENUM', 'INT'].indexOf(this.selectedDataType) > -1)
      {
        data.SHOW_CHAR_LENGTH = true;
        if (!this.model.get('char_length')) {
          this.model.set({char_length: 100});
        }
        data.char_length = this.model.get('char_length');
      } else {
        delete data.char_length;
        if(this.model.has('char_length')) {
          this.model.unset('char_length', {silent: true});
        }
      }

      if(['many_to_one', 'many_to_one_typeahead'].indexOf(this.selectedUI) > -1) {
        data.MANYTOONE = true;
        var tableRelated = this.model.get('table_related');

        var tables = app.schemaManager.getTables();
        tables = tables.map(function(model) {
          if(!tableRelated) {
            tableRelated = model.id;
            this.model.set({table_related: model.id});
          }
          return {id: model.get('table_name'), is_junction_table: model.get('is_junction_table'), selected: (model.id === this.model.get('table_related'))};
        }, this);
        data.tables = tables;

        this.model.set({junction_key_right: this.columnName});
      }

      //If Single_file UI, force related table to be directus_files
      if(this.selectedUI === 'single_file') {
        this.model.set({table_related: 'directus_files'});
      }

      if(['ONETOMANY', 'MANYTOMANY'].indexOf(this.selectedDataType) > -1) {
        data[this.selectedDataType] = true;

        var tableRelated = this.model.get('table_related');
        var junctionTable = this.model.get('junction_table');
        var junctionKeyRight = this.model.get('junction_key_right');

        var tables = app.schemaManager.getTables();
        tables = tables.map(function(model) {
          if(!tableRelated) {
            tableRelated = model.id;
            this.model.set({table_related: model.id});
          }
          return {id: model.get('table_name'), is_junction_table: model.get('is_junction_table'), selected: (model.id === this.model.get('table_related'))};
        }, this);
        data.tables = tables;

        if(this.selectedDataType == 'MANYTOMANY') {
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
          if(!junctionKeyRight && data.columns.length > 0) {
            junctionKeyRight = data.columns[0].column_name;
            this.model.set({junction_key_right: junctionKeyRight});
          }
        }

        this.model.set({relationship_type: this.selectedDataType});
      }

      this.model.set({data_type: this.selectedDataType, ui: this.selectedUI});

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

        if (cleanColumnName && rawColumnName != cleanColumnName) {
          columnNameText = __t('this_column_will_be_saved_as_x', {column_name: cleanColumnName});
        }

        $el.find('#cleanColumnName').text(columnNameText);
      });
    },

    initialize: function() {
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
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: true}});
      return [
        this.saveWidget
      ];
    },

    events: {
      'click .saved-success': function() {
        this.save();
      },
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      }
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

  var EditRelationship = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('relationship_settings'),
        isOverlay: true
      }
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: true}});
      return [
        this.saveWidget
      ];
    },

    events: {
      'click .saved-success': function() {
        this.save();
      },
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      }
    },
    save: function() {
      console.log("Save");
    },
    afterRender: function() {
      this.setView('#page-content', this.table);
    },
    initialize: function(options) {
      this.table = new EditRelationshipView({model: this.model});
    }
  });

  var EditRelationshipView = Backbone.Layout.extend({
    tagName: "form",

    attributes: {
      class: "two-column-form"
    },

    events: {
      'change select#table_related': 'changeRelatedTable'
    },

    changeRelatedTable: function(e) {
      this.model.set({table_related: $(e.target).val()});
    },

    template: 'modules/settings/settings-columns-edit-relationship',

    serialize: function() {
      var data = {};

      var tableRelated = this.model.get('table_related');
      data.data_types = [{title: this.model.get('relationship_type'), selected: true}];

      var tables = app.schemaManager.getTables();
      tables = tables.map(function(model) {
        if(!tableRelated) {
          tableRelated = model.id;
          this.model.set({table_related: model.id});
        }
        return {id: model.get('table_name'), selected: (model.id === this.model.get('table_related'))};
      }, this);
      data.tables = tables;


      return data;
    },

    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    }
  });

  //
  var Columns = Backbone.Layout.extend({

    tagName: 'form',

    attributes: {
      id: "table-settings"
    },

    template: 'modules/settings/settings-columns',

    events: {
      'click i[data-action=ui]': 'editUI',
      'click i[data-action=relationship]': 'editRelationship',
      'change select,input': 'bindForm',
      'click .destroy': 'verifyDestroyColumn',
      'click button[data-action=new-field]': 'newField'
    },

    newField: function(e) {
      var collection = this.collection;
      //@todo: link real col
      var model = new ColumnModel({'data_type':'ALIAS','ui':{}}, {collection: this.collection});
      var view = new NewColumnOverlay({model: model, collection: collection});
      app.router.overlayPage(view);
    },

    // Updates the models when user interacts with the form.
    bindForm: function(e) {
      var id = e.target.getAttribute('data-id');
      var attr = e.target.name;
      var value = e.target.value;
      var model = this.collection.get(id);
      var data = {};

      if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        value = $(e.target).is(':checked') ? 1 : 0;
      }

      // hotfix #1069 single_file UI not saving relational settings
      // If Single_file UI, force related table to be directus_files
      // and relationship type to manytoone
      if(value === 'single_file') {
        data['table_related'] = 'directus_files';
        data['datatype'] = 'INT';
        data['relationship_type'] = 'MANYTOONE';
        data['junction_key_right'] = id;
      }

      this.collection.table.set({'primary_column':$('#table-settings').find('input[type=radio]:checked').attr('data-id')});

      data[attr] = value;
      model.set(data);
    },

    destroyColumn: function(columnName) {
      var originalColumnModel = this.collection.get(columnName);
      var columnModel = originalColumnModel.clone();
      columnModel.url = originalColumnModel.url;

      if (!columnModel) {
        Notification.error('Error', 'Column '+columnName+' not found.');
        return;
      }

      var self = this;
      var onSuccess = function(model, response) {
        if (!response.success) {
          Notification.error('Column not removed', response.message);
        } else {
          self.collection.remove(originalColumnModel);
          self.$el.find('[data-id=' + model.get('id') + ']').remove();
          Notification.success('Column removed', '<b>' + columnName + '</b> was removed.');
        }
      };

      var onError = function(model, resp, options) {
        Notification.error('Column not removed', resp.responseJSON.message);
      };

      columnModel.destroy({success: onSuccess, error: onError, wait: true});
    },

    verifyDestroyColumn: function(event) {
      event.stopPropagation();

      var self = this;
      var columnName = $(event.target).closest('tr').attr('data-id');
      var destroyColumn = function() {
        self.destroyColumn(columnName);
      };

      DoubleConfirmation({
        value: columnName,
        emptyValueMessage: __t('invalid_column'),

        firstQuestion: __t('question_delete_this_column'),
        secondQuestion: __t('question_delete_this_column_confirm', {column_name: columnName}),
        notMatchMessage: __t('column_name_did_not_match'),
        callback: destroyColumn
      }, this);
    },

    sort: function() {
      var collection = this.collection;
      this.$el.find('tbody > tr').each(function(i) {
        var model = collection.get(this.getAttribute('data-id'));
        model.set({sort: i}, {silent: true});
        //console.log(model.id, {sort: i});
      });
      //collection.trigger('change');
      collection.sort();
    },

    editUI: function(e) {
      var id = e.target.getAttribute('data-id');
      var column = this.collection.get(id);
      openFieldUIOptionsView(column);
    },

    editRelationship: function(e) {
      var id = e.target.getAttribute('data-id');
      var column = this.collection.get(id);
      var model = new Backbone.Model(_.extend(column.relationship.toJSON(),{
        data_type: column.get('type'),
        //ui: column.get('ui'),
        //type: column.get('type'),
        relationship_type: column.relationship.get('type')
        //junction_key_left: column.relationship.get('junction_key_right'),
        //table_related: column.relationship.get('table_related')
      }));

      column.relationship = model;
      var that = this;
      var view = new EditRelationship({model: model});
      app.router.overlayPage(view);
      view.save = function() {
        model.url = app.API_URL + 'tables/' + that.collection.table.id + '/columns/' + column.id + '/';
        model.save({}, {success: function() {
          app.router.removeOverlayPage(view); //, {title: 'Add new column', stretch: true}
        }});
      };
    },

    serialize: function() {
      var ui = UIManager.getAllSettings({returnObject: true});

      var primaryColumn = this.collection.table.get('primary_column');
      var rows = this.collection.map(function(model) {
        var row = model.toJSON();

        if (row.is_nullable === "NO") {
          row.required = true;
          row.requiredDisabled = true;
        }

        row.uiHasVariables = ui.hasOwnProperty(row.ui) && ui[row.ui].hasOwnProperty('variables') && ui[row.ui].variables.length > 0;

        row.uiHasRelationship = model.relationship !== undefined;
        row.alias = ['ALIAS','ONETOMANY','MANYTOMANY'].indexOf(row.type) > -1;
        row.types = [];
        row.relationship = "";

        var validation = model.options.validate(model.options.toJSON());

        row.valid = true;
        if (validation !== undefined) {
          row.valid = false;
        }

        switch (model.getRelationshipType()) {
          case 'ONETOMANY':
            row.relationship = "⊣";
            row.relationshipTooltip = model.getRelated();
            break;
          case 'MANYTOONE':
            row.relationship = "⊢";
            row.relationshipTooltip = model.getRelated();
            break;
          case 'MANYTOMANY':
            row.relationship = "⊢⊣";
            row.relationshipTooltip = model.getRelated();
            break;
        }
        // Gather a list of UI alternatives
        _.each(ui, function(ui) {
          if (!ui.system && ui.dataTypes.indexOf(row.type) > -1) {
            row.types.push({id: ui.id, isActive: (ui.id === row.ui)});
          }

          //If System column and column name in config mapping, show detailed message
          if(ui.system && SettingsConfig.systemColumnDetails[row.column_name]) {
            row.systemDetails = SettingsConfig.systemColumnDetails[row.column_name];
          }
        });

        if(primaryColumn === row.column_name) {
          row.master = true;
        } else {
          row.master = false;
        }

        return row;
      });

      return {rows: rows};
    },

    afterRender: function() {
      var container = this.$el.find('tbody')[0];
      var that = this;
      var sort = new Sortable(container, {
        animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
        handle: ".sort", // Restricts sort start click/touch to the specified element
        draggable: "tr", // Specifies which items inside the element should be sortable
        ghostClass: "sortable-ghost",
        filter: ".system", // Selectors that do not lead to dragging (String or Function)
        onStart: function (evt) {
          //var dragItem = jQuery(evt.item);
          var tbody = jQuery(container);
          tbody.addClass('remove-hover-state');
        },
        onEnd: function (evt) {
          //var dragItem = jQuery(evt.item);
          var tbody = jQuery(container);
          tbody.removeClass('remove-hover-state');
        },
        onUpdate: function (evt){
          that.sort();
        }
      });

    },

    initialize: function() {
      this.collection.on('change sync sort', this.render, this);
    }

  });

  var TableModule = Backbone.Layout.extend({
    template: 'modules/settings/module-table-settings',
    attributes: {'class': 'directus-module'},
    serialize: function() {
      return {
        hidden: this.model.get('hidden'),
        single: this.model.get('single'),
        is_junction_table: this.model.get('is_junction_table'),
        footer: this.model.get('footer')
      };
    }
  });

  SettingsTables.Views.Table = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Classes',
        breadcrumbs: [{title: __t('settings'), anchor: '#settings'}, {title: __t('tables_and_inputs'), anchor: '#settings/tables'}]
      }
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: true}});
      return [
        this.saveWidget
      ];
    },

    events: {
      'change select,input': function(e) {
        this.saveWidget.setSaved(false); //Temporarily Just Set it to save once something is changed.
      },
      'click .saved-success': 'saveColumns'
    },

    saveColumns: function(e) {
      var data = {};

      //Take care of the checkboxes
      $('#table-settings').find('input[type=checkbox]:not(:checked)').each(function(){
        data[this.name] = 0;
      }).get();

      data = _.extend(data, $('#table-settings').serializeObject());

      //Get Selected master
      data.primary_column = $('#table-settings').find('input[type=radio]:checked').attr('data-id');

      // Stop asking for primary column
      // if(!data.primary_column) {
      //   app.router.openModal({type: 'alert', text: 'Please choose a primary column:', callback: function(tableName) {
      //   }});
      //   return;
      // }

      this.model.save(data, {success: function(){
        app.router.go('settings','tables');
      }});
    },

    afterRender: function() {
      this.setView('#page-content', this.columns);
      this.collection.fetch();
    },

    initialize: function() {
      this.collection = this.model.columns;
      this.columns = new Columns({collection: this.collection});
      this.headerOptions.route.title = this.model.id;
    }
  });

  var Tables = Backbone.Layout.extend({

    template: 'modules/settings/settings-tables',

    addRowView: function(model, render) {
      var view = this.insertView('tbody', new TablesRow({model: model}));
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
      if (tableIndex == 0 || tableIndex == this.collection.length) {
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
      //Filter out _directus tables
      if (model.id.substring(0,9) === 'directus_') return false;

      //Filter out tables you don't have alter permissions on
      var privileges = app.schemaManager.getPrivileges(model.id);

      // filter out tables with empty privileges
      if (privileges === undefined) return false;

      // only return tables with view permissions
      return privileges.has('allow_view') && privileges.get('allow_view') > 0;
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
      this.collection.each(function(model){
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

    attributes: function() {
      return {
        'data-id': this.model.get('table_name')
      };
    },

    events: {
      'click td span': function(e) {
        e.stopImmediatePropagation();
        var attr = $(e.target).closest('td').attr('data-attribute');

        this.toggleTableAttribute(SchemaManager.getTable($(e.target).closest('tr').attr('data-id')), attr, $(e.target));
      },
      'click td': function(e) {
        var tableName = $(e.target).closest('tr').attr('data-id');
        app.router.go(['settings','tables',tableName]);
      },
      'click .destroy': function(event) {
        event.stopPropagation();

        var self = this;
        var tableName = $(event.target).closest('tr').attr('data-id') || this.model.get('table_name');

        DoubleConfirmation({
          value: tableName,
          emptyValueMessage: __t('invalid_table'),
          firstQuestion: __t('question_delete_this_table'),
          secondQuestion: __t('question_delete_this_table_confirm', {table_name: tableName}),
          notMatchMessage: __t('table_name_did_not_match'),
          callback: this.destroyTable
        }, this);
      }
    },

    toggleTableAttribute: function(tableModel, attr, element) {
      var data = {};
      data[attr] = !tableModel.get(attr);
      tableModel.save(data);
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
      var options = {};
      var self = this;

      options.wait = true;
      options.success = function(model, response) {
        if (response.success == true) {
          var tableName = model.get('table_name');
          var bookmarks = app.router.bookmarks;

          self.remove();
          app.schemaManager.unregisterFullSchema(tableName);

          var model = bookmarks.findWhere({title: app.capitalize(tableName), section: 'table'});
          if (model) {
              bookmarks.remove(model);
          }

          Notification.success('Table removed', '<b>'+tableName+'</b> was removed.', 3000);
        } else {
          Notification.error(response.message);
        }
      };

      this.model.destroy(options);
    },

    serialize: function() {
      return this.model.toJSON();
    }
  });

  SettingsTables.Views.List = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('tables_and_inputs'),
        breadcrumbs: [{title: __t('settings'), anchor: '#settings'}]
      },
    },

    leftToolbar: function() {
      if(!this.widgets.addWidget) {
        this.widgets.addWidget = new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "add", buttonClass: "", buttonText: __t('add')}});
      }
      return [this.widgets.addWidget];
    },

    beforeRender: function() {
      this.setView('#page-content', new Tables({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    },
    initialize: function() {
      this.widgets = {};
    },

    events: {
      'click #addBtn': 'addTableConfirmation'
    },

    addTableConfirmation: function() {
      app.router.openModal({type: 'prompt', text: __t('enter_the_name_of_a_new_or_existing_table_to_add'), callback: _.bind(this.addTable, this)});
    },

    addTable: function(tableName) {
      // @TODO: better error message.
      if (!tableName) {
        app.trigger('alert:error', __t('empty_table_name'), '', true, {
          timeout: 5000
        });
        return;
      }

      var rawTableName = tableName;
      tableName = SchemaHelper.cleanTableName(tableName);

      // Make sure it's an alphanumeric table name
      // and it has at least one character or one number
      if (!(/[a-z0-9]+/i.test(tableName) && /[_-]*/i.test(tableName))) {
        app.trigger('alert:error',
                    __t('you_must_enter_an_valid_table_name'),
                    'letters_az_numbers_andor_underscores_and_dashes',
                    true, {
          timeout: 5000
        });
        return;
      }

      if (app.schemaManager.getPrivileges(tableName)) {
        app.trigger('alert:error', 'Error', 'This table already exists!', true, {
          timeout: 5000
        });
        return;
      }

      // @TODO: make this save a table info rather than permissions.
      var that = this;
      var model = new Backbone.Model();
      model.url = app.API_URL + 'privileges/1';
      // @todo: set default values in the server side
      model.set({group_id: 1, allow_add:1, allow_edit:2, allow_delete:2, allow_alter:1, allow_view:2, table_name: tableName, addTable: true});
      model.save({}, {success: function(model){
        var tableModel = new TableModel({id: tableName, table_name: tableName}, {parse: true, url: app.API_URL + 'tables/' + tableName});
        tableModel.fetch({
          success: function(model) {
            if (rawTableName != tableName) {
              Notification.success(__t('this_table_was_saved_as_x', {table_name: tableName}));
            }
            that.registerTable(model);
          }
        });
      }});
    },

    registerTable: function(tableModel) {
      app.schemaManager.register('tables', [{schema: tableModel.toJSON()}]);
      app.schemaManager.registerPrivileges([{
        table_name: tableModel.get('table_name'),
        allow_add:1,
        allow_edit:2,
        allow_delete:2,
        allow_alter:1,
        allow_view:2,
        group_id: app.getCurrentGroup()
      }]);
      app.schemaManager.registerPreferences([tableModel.preferences.toJSON()]);
      app.router.bookmarks.add(new Backbone.Model({
        icon_class: '',
        title: app.capitalize(tableModel.get('table_name')),
        url: 'tables/' + tableModel.get('table_name'),
        section: 'table'
      }));
    }
  });

  function openFieldUIOptionsView(column) {
    var model = column.options;
    model.set({id: column.get('ui')});
    var schema = app.schemaManager.getColumns('ui', model.id);
    var view = new EditColumn({model: model, schema: schema});
    app.router.overlayPage(view);
    view.save = function() {
      model.save(view.table.data(), {success: function() {
        app.router.removeOverlayPage(view);
      }});
    };
    model.fetch();
  }

  return SettingsTables;

});
