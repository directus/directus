/* global $ */
define([
  'app',
  'backbone',
  'utils',
  'helpers/string',
  'core/t',
  'core/Modal'
], function (app, Backbone, Utils, StringHelper, __t, ModalView) {
  'use strict';

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/permissions-fields',

    events: {
      'click .label': 'onLabelClick',
      'click .js-select-column': 'onSelectColumn'
    },

    onLabelClick: function (event) {
      var $el = $(event.currentTarget);
      var $checkbox = this.$('#' + $el.data('for'));

      $checkbox.click();
    },

    onSelectColumn: function (event) {
      var $checkbox = $(event.currentTarget);
      var $row = $checkbox.closest('tr');

      this.toggleColumn($row.data('column'));
    },

    toggleColumn: function (columnName) {
      var attr = this.name + '_field_blacklist';
      var blacklist = Utils.parseCSV(this.model.get(attr));
      var $checkbox = this.$('#check_c_' + StringHelper.ascii(columnName));
      var changed = false;

      // Remove or add to blacklist
      if (!$checkbox.is(':checked')) {
        if (!this.hasColumn(columnName)) {
          blacklist.push(columnName);
          changed = true;
        }
      } else if (this.hasColumn(columnName)) {
        blacklist.splice(blacklist.indexOf(columnName), 1);
        changed = true;
      }

      if (changed) {
        var attrs = {};
        attrs[attr] = blacklist.join(',');
        this.model.save(attrs, {patch: true});
      }
    },

    hasColumn: function (name) {
      var blacklist = Utils.parseCSV(this.model.get(this.name + '_field_blacklist'));

      return blacklist.indexOf(name) >= 0;
    },

    serialize: function () {
      var data = {columns: []};
      var blacklist = Utils.parseCSV(this.model.get(this.name + '_field_blacklist'));

      data.permission = __t('permissions_' + this.name);
      data.name = this.name;

      data.columns = app.schemaManager.getColumns('tables', this.model.get('table_name'))
        .filter(function (model) {
          return !model.isPrimaryColumn();
        })
        .map(function (model) {
          return {
            column_name: model.id,
            blacklisted: blacklist.indexOf(model.id) >= 0
          };
        }, this);

      return data;
    },

    initialize: function (options) {
      this.name = options.type;
      this.render();
    }
  });

  return ModalView.extend({

    beforeRender: function () {
      this.setView('.modal-bg', this.view);
    },

    initialize: function (options) {
      this.view = new EditFields(options);
    }
  });
});
