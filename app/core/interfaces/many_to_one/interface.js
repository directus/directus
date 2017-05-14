define(['handlebars', 'core/UIView', 'core/t'], function (Handlebars, UIView, __t) {
  'use strict';

  return UIView.extend({
    events: {
      'change select': function (e) {
        var model = this.model.get(this.name);
        var selectedId = parseInt($(e.target).find(':selected').val(), 10);
        model.clear();
        model.set({id: selectedId});
      }
    },

    template: 'many_to_one/input',

    serialize: function () {
      var optionTemplate = Handlebars.compile(this.options.settings.get('visible_column_template'));

      if (this.options.settings.get('readonly') === true) {
        this.canEdit = false;
      }

      var data = this.collection.map(function (model) {
        var data = model.toJSON();

        var name = optionTemplate(data);
        return {
          id: model.id,
          name: name,
          selected: this.options.value !== undefined && (model.id === this.options.value.id)
        };
      }, this);

      // Default data while syncing (to avoid flickr when data is loaded)
      if (this.options.value !== undefined && this.options.value.id && !data.length) {
        data = [{
          id: this.options.value.id,
          name: this.options.value,
          selected: true
        }];
      }

      data = _.sortBy(data, 'name');

      return {
        canEdit: this.canEdit,
        name: this.options.name,
        data: data,
        handleBarString: this.options.settings.get('value_template'),
        comment: this.options.schema.get('comment'),
        use_radio_buttons: this.options.settings.get('use_radio_buttons') === true,
        allowNull: this.options.settings.get('allow_null') === true,
        placeholder_text: (this.options.settings.get('placeholder_text')) ? this.options.settings.get('placeholder_text') : __t('select_from_below')
      };
    },

    initialize: function () {
      var relatedTable;
      // @TODO display warning on UI & gracefully fail if the next value is undefined
      if (this.columnSchema.relationship) {
        relatedTable = this.columnSchema.relationship.get('related_table');
      } else {
        console.error(__t('column_misconfigured_in_directus_columns', {
          column: this.name
        }));
      }
      var value = this.model.get(this.name);
      this.canEdit = this.model.canEdit(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});

      var status = 1;
      if (this.options.settings.get('visible_status_ids')) {
        status = this.options.settings.get('visible_status_ids');
      }

      var data = {};
      if (value.table.hasStatusColumn()) {
        data[value.table.getStatusColumnName()] = status;
      }

      var visibleColumns = [];
      if (this.options.settings.get('visible_column')) {
        visibleColumns = this.options.settings.get('visible_column').split(',');
      }

      if (value.table.hasPrimaryColumn() && visibleColumns.indexOf(value.table.getPrimaryColumnName()) < 0) {
        visibleColumns.push(value.table.getPrimaryColumnName());
      }

      data.columns_visible = visibleColumns.join(',');

      // FILTER HERE!
      this.collection.fetch({includeFilters: false, data: data});
      // This.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    }
  });
});
