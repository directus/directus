/* global $ */
define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/UIView',
  'core/t',
  'utils'
], function (app, Backbone, _, Handlebars, UIView, __t, Utils) {
  'use strict';

  return UIView.extend({

    template: 'many_to_one/input',

    events: {
      'change select': function (event) {
        var model = this.model.get(this.name);
        var $target = $(event.currentTarget);
        var selectedId = $target.find(':selected').val();
        var attributes;
        var primaryColumn;
        var attributesName;

        if (this.collection.get(selectedId)) {
          attributes = this.collection.get(selectedId).toJSON();
          primaryColumn = this.columnSchema.table.get('primary_column') || 'id';

          // TODO: Set proper model based on table name
          // ex: GroupsModel for directus_groups
          if (!(model instanceof Backbone.Model)) {
            model = new Backbone.Model();
            model.set(primaryColumn, selectedId);
          }

          attributesName = _.keys(model.attributes);
          model.clear();

          if (attributesName.length > 0) {
            attributes = _.pick(attributes, attributesName);
          }

          model.set(attributes);
        } else {
          model = null;
        }

        this.value = model;
        this.model.set(this.name, this.getValue());
      }
    },

    getPrivilege: function () {
      return app.schemaManager.getPrivileges(this.columnSchema.getRelatedTableName());
    },

    visible: function () {
      // Hide M2O Interface if the user has not permission to read the related table data
      return this.canRead() === true;
    },

    canRead: function () {
      var privilege = this.getPrivilege();

      return privilege && privilege.canView();
    },

    canEdit: function () {
      var privilege = this.getPrivilege();

      return privilege && privilege.canEdit();
    },

    canAdd: function () {
      var privilege = this.getPrivilege();

      return privilege && privilege.canAdd();
    },

    getValue: function () {
      var value = this.value;

      // If the user has permission to edit or add value is a model
      // otherwise is the id
      if (value && (this.canEdit() || this.canAdd())) {
        value = this.value.id;
      }

      return value;
    },

    unsavedChange: function () {
      var value = this.getValue();
      // NOTE: Only set the new value (mark changed) if the value has changed
      if (value && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return value;
      }
    },

    serialize: function () {
      var columnTemplate = this.options.settings.get('visible_column_template');
      var templateColumns = Utils.getTemplateVariables(columnTemplate);
      var optionTemplate = Handlebars.compile(columnTemplate);
      var defaultValue = this.options.schema.get('default_value');
      var placeholderAvailable = Boolean(this.options.settings.get('placeholder')) && this.options.settings.get('placeholder').length > 0;
      var value = this.options.value || defaultValue;

      if (value instanceof Backbone.Model) {
        value = value.id;
      }

      // sort by the template columns
      // it can be multiple columns
      // and it will be sorted by its data type
      // https://github.com/directus/directus/issues/1769
      this.collection.sortBy(templateColumns);

      var data = this.collection.map(function (model) {
        var data = model.toJSON();

        return {
          id: model.id,
          name: optionTemplate(data),
          selected: value !== undefined && model.id === value
        };
      }, this);

      // Pick first element if there's no placeholder available
      if (data.length > 0 && !placeholderAvailable && value === undefined) {
        value = data[0].id;
      }

      // Default data while syncing (to avoid flickr when data is loaded)
      if (this.options.value !== undefined && this.options.value.id && data.length === 0) {
        data = [{
          id: this.options.value.id,
          name: '--', // data has not loaded or user has not permission to the related table
          selected: true
        }];
      }

      this.value = value;

      return {
        name: this.options.name,
        data: data,
        handleBarString: this.options.settings.get('value_template'),
        comment: this.options.schema.get('comment'),
        use_radio_buttons: this.options.settings.get('use_radio_buttons') === true,
        allowNull: this.options.settings.get('allow_null') === true,
        placeholder: this.options.settings.get('placeholder'),
        placeholderAvailable: placeholderAvailable,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: this.value,
        required: this.options.schema.isRequired()
      };
    },

    initialize: function () {
      // TODO display warning on UI & gracefully fail if the next value is undefined
      if (!this.columnSchema.relationship) {
        console.error(__t('column_misconfigured_in_directus_columns', {
          column: this.name
        }));
      }

      var value = this.model.get(this.name);
      value.startTracking();

      this.collection = value.collection.getNewInstance({omit: ['preferences']});

      var data = {};

      var visibleStatusIDs = this.options.settings.get('visible_status_ids');
      if (visibleStatusIDs) {
        data.status = visibleStatusIDs;
      }

      var visibleColumns = [];
      if (this.options.settings.get('visible_column')) {
        visibleColumns = Utils.parseCSV(this.options.settings.get('visible_column'));
      }

      if (value.table.hasPrimaryColumn() && visibleColumns.indexOf(value.table.getPrimaryColumnName()) < 0) {
        visibleColumns.push(value.table.getPrimaryColumnName());
      }

      data.columns_visible = visibleColumns.join(',');
      if (this.columnSchema.options.get('result_limit')) {
        data.limit = this.columnSchema.options.get('result_limit');
      }

      // FILTER HERE!
      if (this.canRead()) {
        this.collection.fetch({includeFilters: false, data: data});
      }

      // This.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    }
  });
});
