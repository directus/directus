//  settings.js
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
  'modules/settings.tables',
  'modules/settings.global'
],

function(app, Backbone, ui, Directus, SettingsTables, SettingsGlobal) {

  var Settings = app.module();

  Settings.Model = Backbone.Model.extend({});
  Settings.Collection = Backbone.Collection.extend({});
  Settings.Views = {};

  Settings.Views.UISettings = Backbone.Layout.extend({
  template: 'settings_ui',

  serialize: function() {
      var options = _.map(ui.get(this.model.id).options, function(obj) {
        obj[obj.type] = true;
        obj.value = this.model.get(obj.name);
        return obj;
      },this);
      return {options: options, id: this.model.id};
    }
  });

  Settings.Views.TableRow = Backbone.Layout.extend({
    tagName: 'tr',
    template: 'settings_tables_field',
    events: {
      'click #open-settings-modal': 'openModal'
    },

    openModal: function() {
      var ui = $('select option:selected', this.context).text();
      var model = this.model.options.get(ui) || this.model.options.add({id:ui}).get(ui);
      var title = model.collection.parent.collection.tableName + ' / ' + model.collection.parent.get('title') + ' / ' + ui;
      this.modal = new Directus.Modal({
        title: title,
        stretch: false,
        view: new Settings.Views.UISettings({model: model})
      });

    },
    serialize: function() {
      var types = _.pluck(ui.perType(this.model.get('type')),'id');
      return {types: types, model: this.model.toJSON(), tableId: this.model.collection.tableName};
    },
    beforeRender: function() {
      this.$el.attr('id', this.id);
    },
    initialize: function() {
      this.id = this.model.collection.tableName + '-' + this.model.id;
      this.context = '#'+this.id;
    }
  });

  Settings.Views.Table = SettingsTables.Views.Table;

  Settings.Views.Tables = SettingsTables.Views.List;

  Settings.Views.Global = SettingsGlobal;

  Settings.Views.System = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'System',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
    }
  });

  Settings.Views.Permissions = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'Permissions',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
    }
  });

  Settings.Views.About = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'About',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
    }
  });

  Settings.Views.Main = Backbone.Layout.extend({
    template: 'settings'
  });

  return Settings;
});