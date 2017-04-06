define([
  'app',
  'underscore',
  'backbone'
],
function(app, _, Backbone) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/status',

    tagName: 'div',

    attributes: {
      class: 'status'
    },

    state: {
      open: false
    },

    events: {
      'click .js-status': function (event) {
        this.$el.toggleClass('expanded');
        this.state.open = !this.state.open;
      },

      'click li': function (event) {
        if (this.state.open) {
          this.$('li').removeClass('active');
          var $status = $(event.currentTarget);
          $status.addClass('active');

          this.model.set(this.getStatusColumnName(), $status.data('id'));
        }
      }
    },

    getStatusColumnName: function () {
      var table = this.model.table;

      return table.getStatusColumnName();
    },

    serialize: function() {
      var statuses = [];
      var attr = this.getStatusColumnName();
      var currentStatus = this.model.get(attr);
      var model = this.model;

      model.getTableStatusMapping().each(function (status) {
        var item = status.toJSON();
        // Delete entry are performed on the header delete button
        if (status.get('hidden_globally') !== true) {
        // if (key !== app.statusMapping.deleted_num) {
        //   item.id = key;
        //   item.selected = key === currentStatus;
          item.selected = status.get('id') === currentStatus;
          item.model = status;
          item.color = item.background_color || item.color;
          statuses.push(item);
        }
      });

      statuses = _.sortBy(statuses, function(item) {
        return item.sort;
      });

      return {
        model: this.model,
        readonly: typeof this.model.canEdit === 'function' ? this.model.canEdit(attr) : true,
        statuses: statuses
      };
    },

    afterRender: function() {

    },

    initialize: function() {
    }
  });
});
