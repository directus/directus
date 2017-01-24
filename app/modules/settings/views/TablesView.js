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
  '../SettingsConfig'
],

function(app, _, Backbone, Directus, EditView, BasePageView, TableModel, ColumnModel, UIManager, Widgets, SchemaManager, Sortable, Notification, DoubleConfirmation, __t, SchemaHelper, SettingsConfig) {

  'use strict';

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
      var uiName = null;
      var model = this.collection.get(id);
      var relationship = model.relationship;
      var data = {};

      if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        value = $(e.target).is(':checked') ? 1 : 0;
      }

      // hotfix: uiName was depending on the target element that was changed
      //         if the element triggering the event is not the dropdown
      //         the uiName should be the one already on the model.
      if (e.target.type === 'select-one') {
        uiName = value;
      } else {
        uiName = model.get('ui');
      }

      // hotfix #1069 single_file UI not saving relational settings
      // If Single_file UI, force related table to be directus_files
      // and relationship type to manytoone
      data['related_table'] = null;
      data['data_type'] = null;
      data['relationship_type'] = null;
      data['junction_key_right'] = null;
      data['junction_key_left'] = null;
      data['junction_table'] = null;

      if (relationship) {
        data['related_table'] = relationship.get('related_table');
        data['relationship_type'] = relationship.get('type');
        data['junction_key_right'] = relationship.get('junction_key_right');
        data['junction_key_left'] = relationship.get('junction_key_left');
        data['junction_table'] = relationship.get('junction_table');
      }

      switch(uiName) {
        case 'multiple_files':
          data['related_table'] = 'directus_files';
        case 'many_to_many':
          data['data_type'] = 'ALIAS';
          data['relationship_type'] = 'MANYTOMANY';
          break;
        case 'single_file':
          data['related_table'] = 'directus_files';
        case 'many_to_one':
        case 'many_to_one_typeahead':
          data['data_type'] = 'INT';
          data['relationship_type'] = 'MANYTOONE';
          data['junction_key_right'] = id;
          break;
        case 'one_to_many':
          data['data_type'] = 'ALIAS';
          data['relationship_type'] = 'ONETOMANY';
          break;
      }

      if (data['relationship_type'] && !model.relationship) {
        model.relationship = new Backbone.Model({
          type: data['relationship_type'],
          related_table: data['related_table'],
          junction_table: data['junction_table'],
          junction_key_right: data['junction_key_right'],
          junction_key_left: data['junction_key_left']
        });
      } else if (!data['relationship_type']) {
        model.relationship = undefined;
      }

      data[attr] = value;
      model.set(data);

      this.render();
    },

    destroyColumn: function(columnName) {
      var originalColumnModel = this.collection.get(columnName);
      var columnModel = originalColumnModel.clone();
      // url can be a function or a string
      // getting the result directly from the original model will prevent issue calling the function
      // calling the url() on the cloned model will throw an error because it doesn't have a collection object
      columnModel.url = _.result(originalColumnModel, 'url');

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
      // NOTE: This create new attributes for the column attribute hash
      var dataType = column.get('type');
      var relationshipDataType = column.relationship.get('type');
      column.set(column.relationship.toJSON());
      // hotfix: type and relationship has to be passed as part of the hash
      // prevent the field dropdown to be empty
      // As there's not UI supporting relationship type
      column.set('relationship_type', relationshipDataType);
      column.set('type', dataType);
      var view = new EditRelationship({
        model: column,
        collection: this.collection,
        hiddenFields: ['field_name'],
        // Do not allow to select any other ui.
        ui_filter: function(ui) {
          return ui.id === column.get('ui');
        }
      });

      app.router.overlayPage(view);
    },

    serialize: function() {
      var ui = UIManager.getAllSettings({returnObject: true});
      var rows = this.collection.map(function(model) {
        var row = model.toJSON();

        row.uiHasVariables = ui.hasOwnProperty(row.ui) && ui[row.ui].hasOwnProperty('variables') && ui[row.ui].variables.length > 0;

        row.uiHasRelationship = model.relationship !== undefined;
        row.alias = ['ALIAS','ONETOMANY','MANYTOMANY'].indexOf(row.type) > -1;
        // Existing columns that should be type ALIAS
        row.type = row.alias ? 'ALIAS' : row.type;
        row.types = [];
        row.relationship = '';
        row.requiredDisabled = !row.alias && row.is_nullable === 'NO' && row.default_value === undefined;

        var validation = model.options.validate(model.options.toJSON());
        row.valid = validation === undefined;

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
          var dataType = (row.alias) ? model.getRelationshipType() : row.type;
          if (!ui.system && ui.dataTypes.indexOf(dataType) > -1) {
            row.types.push({id: ui.id, isActive: (ui.id === row.ui)});
          }

          //If System column and column name in config mapping, show detailed message
          if(ui.system && SettingsConfig.systemColumnDetails[row.column_name]) {
            row.systemDetails = SettingsConfig.systemColumnDetails[row.column_name];
          }
        });

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
        footer: this.model.get('footer')
      };
    }
  });

  SettingsTables.Views.Table = EditView.extend({//BasePageView.extend({
    getHeaderOptions: function() {
      var options = EditView.prototype.getHeaderOptions.apply(this, arguments);

      return _.extend(options, {
        route: {
          breadcrumbs: [
            {title: __t('settings'), anchor: '#settings'},
            {title: __t('tables_and_inputs'), anchor: '#settings/tables'}
          ]
        },
        basicSave: true
      });
    },

    rightPane: false
    // headerOptions: {
    //   route: {
    //     title: 'Classes',
    //     breadcrumbs: [{title: __t('settings'), anchor: '#settings'}, {title: __t('tables_and_inputs'), anchor: '#settings/tables'}]
    //   }
    // },
    //
    // leftToolbar: function() {
    //   var self = this;
    //   this.saveWidget = new Widgets.SaveWidget({
    //     widgetOptions: {
    //       basicSave: true
    //     },
    //     onClick: function() {
    //       self.editView.save();
    //     }
    //   });
    //   var editView = this;
    //   this.saveWidget = new Widgets.SaveWidget({
    //     widgetOptions: {
    //       basicSave: this.headerOptions.,
    //       singlePage: this.single
    //     },
    //     onClick: _.bind(editView.saveConfirm, editView)
    //   });
    //
    //   this.saveWidget.setSaved(false);
    //   return [
    //     this.saveWidget
    //   ];
    // },
    //
    // events: {
    //   'change select,input': function(e) {
    //     this.saveWidget.setSaved(false); //Temporarily Just Set it to save once something is changed.
    //   },
    //   'click .saved-success': 'saveColumns'
    // },
    //
    // saveColumns: function(e) {
    //   var data = {};
    //
    //   //Take care of the checkboxes
    //   $('#table-settings').find('input[type=checkbox]:not(:checked)').each(function(){
    //     data[this.name] = 0;
    //   }).get();
    //
    //   data = _.extend(data, $('#table-settings').serializeObject());
    //
    //   this.model.save(data, {success: function(){
    //     app.router.go('settings','tables');
    //   }});
    // },

    // afterRender: function() {
    //   // this.setView('#page-content', this.columns);
    //   //this.setView('#page-content', this.editView);
    //   // this.collection.fetch();
    //   this.model.fetch();
    // },

    // initialize: function() {
      // this.collection = this.model.columns;
      // this.columns = new Columns({collection: this.collection});
      // this.headerOptions.route.title = this.model.id;

      // this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
      //this.editView = new EditView({model: this.model});
    // }
  });

  var Tables = Backbone.Layout.extend({

    template: 'modules/settings/settings-tables',

    events: {
      'click .js-row': function(event) {
        var tableName = $(event.currentTarget).data('id');

        app.router.go(['settings', 'tables', tableName]);
      }
    },

    addRowView: function(model, render) {
      var view = this.insertView('tbody', new TablesRow({
        model: model,
        unregistered: !this.hasPrivilege(model)
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
      //Filter out _directus tables
      if (model.id.substring(0,9) === 'directus_') return false;

      return true;
    },

    hasPrivilege: function(model) {
      // Filter out tables you don't have alter permissions on
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

  var TablesUnRegistered = Tables.extend({

    template: 'modules/settings/settings-tables-unregistered',

    addRowView: function(model, render) {
      var view = this.insertView('tbody', new TablesRow({
        model: model,
        unregistered: true,
        parent: this
      }));
      if (render !== false) {
        view.render();
      }
    },

    beforeRender: function() {
      var self = this;
      this.unregistedCount = 0;
      this.collection.each(function(model) {
        var inactiveTable = app.schemaManager.getPrivileges(model.id) === null;
        if (!inactiveTable && !this.isValidModel(model)) {
          return false;
        }

        if (inactiveTable) {
          self.unregistedCount++;
          this.addRowView(model, false, inactiveTable);
        }
      }, this);
    },

    serialize: function() {
      return {
        unregisteredCount: this.unregistedCount
      }
    }
  });


  var TablesRow = Backbone.Layout.extend({

    template: 'modules/settings/settings-tables-rows',

    tagName: 'tr',

    attributes: function() {
      return {
        'class': 'js-row',
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

      'click .js-add-table': function(event) {
        event.stopPropagation();

        var $row = $(event.target).closest('tr');
        var tableName = $row.data('id');

        app.schemaManager.addTable(tableName, function(tableModel) {
          app.router.bookmarks.addTable(tableModel);
          app.router.go(['settings', 'tables', tableName]);
        });
      },

      'click .js-remove-table': function(event) {
        event.stopPropagation();

        var tableName = $(event.target).closest('tr').data('id') || this.model.get('table_name');

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
      var options = {};
      var self = this;

      options.wait = true;
      options.success = function(model, response) {
        if (response.success === true) {
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
      var data = this.model.toJSON();
      data.unregisteredTable = this.unregistedTable;

      return data;
    },

    initialize: function(options) {
      this.unregistedTable = options.unregistered === true;
      this.parentView = options.parent;
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

    beforeRender: function() {
      this.setView('#page-content', new Tables({collection: this.collection}));
      // this.insertView('#page-content', new TablesUnRegistered({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    },

    initialize: function() {
      this.widgets = {};
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
      app.schemaManager.addTable(tableName, function(tableModel) {
        if (rawTableName !== tableName) {
          Notification.success(__t('this_table_was_saved_as_x', {table_name: tableName}));
        }

        // @TODO: listen to a tables collection
        // to add or remove table from sidebar
        app.router.bookmarks.addTable(tableModel);
      });
    },
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
