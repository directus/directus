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
      'click .js-status': function(event) {
        this.$el.toggleClass('expanded');
        this.state.open = !this.state.open;
      },

      'click li': function(event) {
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

      return table ? table.getStatusColumnName() : app.statusMapping.status_name;
    },

    serialize: function() {
      var status = [];
      var attr = this.getStatusColumnName();
      var currentStatus = this.model.get(attr);

      _.each(app.statusMapping.mapping, function(item, key) {
        // Delete entry are performed on the header delete button
        if (key !== app.statusMapping.deleted_num) {
          item.id = key;
          item.selected = key === currentStatus;
          status.push(item);
        }
      });

      status = _.sortBy(status, function(item) {
        return item.sort;
      });

      return {
        readonly: typeof this.model.canEdit === 'function' ? this.model.canEdit(attr) : true,
        status: status
      };
    },

    afterRender: function() {

    },

    initialize: function() {
    }
  });
});
