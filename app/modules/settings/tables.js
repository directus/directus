//  tables.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'ui/ui',
  'core/directus',
  'jquery-ui'
],

function(app, Backbone, ui, Directus) {

  var SettingsTables = app.module();

  // Handles new columns and aliases.
  // Rendered inside modal
  var NewColumn = Backbone.Layout.extend({

    tagName: 'form',

    template: 'settings-columns-add',

    attributes: {'class':'directus-form'},

    events: {
      'change select': function(e) {
        var data = this.$el.serializeObject();
        this.model.clear({silent: true});
        this.model.set(data);
        console.log(this.model);
      }
    },

    serialize: function() {
/*      options = {};
      options.types = _.chain(app.router.uiSettings)
        .filter(function(ui) { return (!ui.system); })
        .map(function(ui) { return {id: ui.id, datatype: ui.dataTypes[0]}; })
        .value();*/

      var tables = app.tables;
      var options = {data: this.model.toJSON()};
      var dataType = this.model.get('data_type');
      var tableRelated = this.model.get('table_related');

      if (dataType !== undefined) {
        options[dataType] = true;
        if (['ONETOMANY','MANYTOMANY','ALIAS'].indexOf(dataType) > -1) {
          options.directusType = true;
        }
      }
      if (tableRelated !== undefined) {
        options.columns = app.columns[tableRelated].map(function(model) {
          return {column_name: model.id};
        }, this);
      }
      if (dataType === 'MANYTOMANY') {
        options.junctionTables = app.tables.chain()
          .filter(function(model) { return model.get('is_junction_table'); })
          .map(function(model) { return {id: model.id, selected: (model.id === this.model.get('junction_table'))}; }, this)
          .value();
      }

      options.tables = app.tables.map(function(model) {
        return {id: model.get('table_name'), is_junction_table: model.get('is_junction_table') ,selected: (model.id === this.model.get('table_related'))};
      },this);

      return options;
    },

    initialize: function() {
      this.model.on('change', this.render, this);
    }

  });

  //
  var Columns = Backbone.Layout.extend({

    tagName: 'form',

    template: 'settings-columns',

    events: {
      'click button[data-action=ui]': 'editUI',
      'change select,input': 'bindForm',
      'click button[data-action=new-field]': 'newField'
    },

    newField: function(e) {
      var collection = this.collection;
      var model = new Directus.Structure.Column({'data_type':'ALIAS','ui':{}}, {collection: this.collection});
      var view = new NewColumn({model: model});
      var modal = app.router.openModal(view, {title: 'Add new column', stretch: true});
      view.render();
      modal.save = function() {
        var data = view.$el.serializeObject();
        model.clear({silent: true});
        model.save(data,{success: function() {
          modal.close();
          collection.add(model);
          collection.trigger('change');
        }});
      };
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

      //Unset previous master
      if (attr === 'master') {
        var master = this.collection.where({master: true});
        if (master.length) {
          master[0].set({master: false}, {silent: true});
        }
      }

      data[attr] = value;

      model.set(data);

      console.log(model);
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
      var model = this.collection.get(id);
      var schema = app.uiSettings[model.get('ui')].schema;
      var options = model.options;
      var view = new Directus.EditView({model: options, structure: schema});
      var modal = app.router.openModal(view, {title: 'UI Settings'});
      modal.save = function() {
        options.save(view.data(), {success: function() {
          console.log('HEPP');
        }});
        this.close();
      };
      options.fetch();
    },

    serialize: function() {
      var ui = app.uiSettings;
      var rows = this.collection.map(function(model) {
        var row = model.toJSON();
        row.uiHasVariables = ui.hasOwnProperty(row.ui) && ui[row.ui].hasOwnProperty('variables');
        row.alias = ['ALIAS','ONETOMANY','MANYTOMANY'].indexOf(row.type) > -1;
        row.types = [];
        // Gather a list of UI alternatives
        _.each(ui, function(ui) {
          if (!ui.system && ui.dataTypes.indexOf(row.type) > -1) {
            row.types.push({id: ui.id, isActive: (ui.id === row.ui)});
          }
        });
        return row;
      });
      return {rows: rows};
    },

    afterRender: function() {
      this.$el.find('tbody').sortable({
        stop: _.bind(this.sort, this),
        axis: "y",
        handle: '.sort'
      });

    },

    initialize: function() {
      this.collection.on('change reset sort', this.render, this);
    }

  });

  var Tables = Backbone.Layout.extend({

    template: 'settings-tables',

    events: {
      'click td': function(e) {
        var tableName = e.target.getAttribute('data-id');
        console.log(tableName);
        app.router.go(['settings','tables',tableName]);
      }
    },

    serialize: function() {
      return {rows: this.collection.getRows()};
    }

  });

  SettingsTables.Views.Table = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #save-form': 'saveColumns'
    },

    saveColumns: function(e) {
      var options = {};
      options.columns = ['column_name','ui','hidden_input','required','master','sort','comment'];
      options.success = function() {
        app.router.go(['settings','tables']);
      };
      this.collection.save(undefined, options);
    },
/*
    serializeTableForm: function($form) {
      var form = [];
      $form.find('tbody > tr').each(function() {
        var item = {id: this.getAttribute('data-id')};
        $(this).find("input,select,textarea").each(function() {
          var value = this.value;
          var $this = $(this);

          if ($this.attr('type') === 'checkbox' || $this.attr('type') === 'radio') {
            value = $this.is(':checked');
          }

          item[this.name] = value;
        });
        form.push(item);
      });
      console.log(form);
      return form;
    },
*/
    serialize: function() {
      var data = {
        title: this.collection.table.id,
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Tables', anchor: '#settings/tables'}],
        sidebar: true
      };
      return data;
    },

    beforeRender: function() {
      this.setView('#sidebar', new Backbone.Layout({template: 'module-save', attributes: {'class': 'directus-module'}, serialize: {showActive: false, showDropdown: false, showDelete: false}}));
    },

    afterRender: function() {
      this.setView('#page-content', this.columns);
      this.collection.fetch();
    },

    initialize: function() {
      this.columns = new Columns({collection: this.collection});
      //this.collection.on('change', this.render, this);
    }
  });

  SettingsTables.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {
        title: 'Tables',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
      };
    },

    beforeRender: function() {
      this.setView('#page-content', new Tables({collection: this.collection}));
    }
  });

  return SettingsTables;

});