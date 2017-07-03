/* global $ */
define([
  'utils',
  'underscore',
  'core/UIView'
], function (Utils, _, UIView) {
  return UIView.extend({
    template: '_system/status/input',

    events: {
      'change input[type=radio]': function (event) {
        var statusValue = $(event.currentTarget).val();

        this.$('input[type=hidden]').val(statusValue);
        this.model.set(this.name, statusValue);
      }
    },

    // NOTE: Force status interface visibility on new items
    visible: function () {
      if (this.model.isNew()) {
        return true;
      }
    },

    serialize: function () {
      var currentStatus = this.options.value;

      if (this.model.isNew() && Utils.isNothing(currentStatus)) {
        currentStatus = this.options.schema.get('default_value');
      }

      var model = this.model;

      var statuses = model.getStatusVisible().map(function (status) {
        var item = status.toJSON();

        // NOTE: do not strictly compare as status can (will) be string
        item.selected = status.get('id') == currentStatus; // eslint-disable-line eqeqeq
        item.model = status;

        return item;
      });

      // Make sure the order is right
      statuses.sort(function (a, b) {
        return a.sort - b.sort;
      });

      return {
        name: this.options.name,
        value: this.options.value,
        readonly: !this.options.canWrite,
        statuses: statuses
      };
    }
  });
});
