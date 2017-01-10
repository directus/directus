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

          this.model.set(app.statusMapping.status_name, $status.data('id'));
        }
      }
    },

    serialize: function() {
      var status = [];
      var attr = app.statusMapping.status_name;
      var currentStatus = this.model.get(attr);

      _.each(app.statusMapping.mapping, function(item, key) {
        item.id = key;
        item.selected = key === currentStatus;
        status.push(item);
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
