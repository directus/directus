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
  'sortable'
],

function(app, Backbone, Directus, BasePageView, TableModel, ColumnModel, UIManager, Widgets, SchemaManager, Sortable) {
  "use strict";

  var SettingsTables = app.module();

  // Handles new columns and aliases.
  // Rendered inside modal
  var NewColumnOverlay = BasePageView.extend({
    headerOptions: {
      route: {

        title: 'New Column',
        isOverlay: true
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-check", buttonClass: "add-color-background"}})
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
          that.model.set(data);
          app.router.removeOverlayPage(that); //, {title: 'Add new column', stretch: true}
          that.collection.add(that.model);
          that.collection.trigger('change');
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
      },
      'change #junction_key_right': function(e) {
        this.model.set({junction_key_right: $(e.target).val()});
      },
      'change #junction_key_left': function(e) {
        this.model.set({junction_key_left: $(e.target).val()});
      },
      'change #table_junction': function(e) {
        this.model.set({junction_table: $(e.target).val()});
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
          this.model.set({char_length: 1});
        }
        data.char_length = this.model.get('char_length');
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
          data.junctionTables = _.chain(tables).filter(function(model) { return model.is_junction_table; })
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
              return {column_name: model.id, selected: (model.id === this.model.get('junction_key_right'))};
            }, this);
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

    initialize: function() {
      this.model.on('change', this.render, this);
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
        title: 'Relationship Settings',
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
      'click span[data-action=ui]': 'editUI',
      'click span[data-action=relationship]': 'editRelationship',
      'change select,input': 'bindForm',
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

      this.collection.table.set({'primary_column':$('#table-settings').find('input[type=radio]:checked').attr('data-id')});

      data[attr] = value;
      model.set(data);
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
      var model = column.options;
      model.set({id: column.get('ui')});

      var schema = app.schemaManager.getColumns('ui', model.id);
      var view = new EditColumn({model: model, schema: schema});
      app.router.overlayPage(view);
      view.save = function() {
        model.save(view.table.data(), {success: function() {
          app.router.removeOverlayPage(view); //, {title: 'Add new column', stretch: true}
        }});
      };
      model.fetch();
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
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Tables+Inputs', anchor: '#settings/tables'}]
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

      if(!data.primary_column) {
        app.router.openModal({type: 'alert', text: 'Please Select A Primary Column', callback: function(tableName) {
        }});
        return;
      }

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

    isValidModel: function(model) {
      //Filter out _directus tables
      if (model.id.substring(0,9) === 'directus_') return false;

      //Filter out tables you don't have alter permissions on
      var privileges = app.schemaManager.getPrivileges(model.id);

      // filter out tables with empty privileges
      if (privileges === undefined) return false;

      var permissions = privileges.get('permissions').split(',');

      // only return tables with view permissions
      return _.contains(permissions, 'alter');
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
      this.listenTo(this.collection, 'add', this.addRowView);
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

    serialize: function() {
      return this.model.toJSON();
    }
  });

  SettingsTables.Views.List = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Tables+Inputs',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
      },
    },

    leftToolbar: function() {
      if(!this.widgets.addWidget) {
        this.widgets.addWidget = new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus", buttonClass: "add-color-background"}});
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
      'click #addBtn': function() {
        var that = this;
        app.router.openModal({type: 'prompt', text: 'Please enter the name of the table you would like to add', callback: function(tableName) {
          if(tableName && !app.schemaManager.getPrivileges(tableName)) {
            var model = new Backbone.Model();
            model.url = app.API_URL + 'privileges/1';
            model.set({group_id: 1, permissions: 'add,edit,bigedit,delete,bigdelete,alter,view,bigview', table_name: tableName, addTable: true});
            model.save({}, {success: function(model){
              var tableModel = new TableModel({id: tableName, table_name: tableName}, {parse: true, url: app.API_URL + 'tables/' + tableName});
              tableModel.fetch();
              tableModel.columns.table = tableModel;
              that.collection.add(tableModel);
            }});
          }
        }});
      }
    }
  });

  return SettingsTables;

});