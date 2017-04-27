define([
  'app',
  'underscore',
  'backbone'
], function(app, _, Backbone) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/set-status',

    tagName: 'div',

    attributes: {
      class: 'select-container',
      id: 'batchStatus',
      style: 'display:inline-block;'
    },

    events: {
      'change .js-status': function (event) {
        var value = $(event.currentTarget).val();
        if (value === 0) {
          var that = this;
          // @TODO: Make this a translation text
          app.router.openModal({type: 'confirm', text: 'Are you sure? This item will be removed from the system!', callback: function() {
            that.doAction(value);
          }});
        } else {
          this.doAction(value);
        }
      }
    },

    doAction: function (value) {
      // var value = $(e.target).closest('li').attr('data-value');
      var collection = this.collection;
      // var status = collection.getFilter('status');
      var $checked = $('.js-select-row:checked');
      var models = [];
      var actionCollection = collection.clone();

      actionCollection.reset();
      $checked.each(function () {
        var model = collection.get(this.value);

        actionCollection.add(model);
        models.push(model);
      });

      var success = function (model, resp, options) {
        collection.trigger('visibility');
        collection.trigger('select');
        options.remove = false;
        collection.trigger('sync', model, resp, options);
      };

      actionCollection.saveWithStatus(value, {
        patch: true,
        validate: false,
        wait: true,
        success: success
      });
    },

    serialize: function() {
      var data = this.options.widgetOptions;
      var canDelete = this.collection.hasPermission('delete') || this.collection.hasPermission('bigdelete');
      var collection = this.collection;
      var table = collection.table;
      var statusColumnName = table.getStatusColumnName();
      var hasStatusColumn = this.collection.table.columns.get(statusColumnName);
      var mapping = app.statusMapping.get(table.id, true).get('mapping');

      data.hasStatusColumn = hasStatusColumn;
      data.mapping = [];

      // @note: duplicate code, same as Visibility Widget
      _.each(this.collection.getStatusVisible(), function (status) {
        data.mapping.push(status.toJSON());
      });

      data.mapping.sort (function(a, b) {
        return a.sort > b.sort;
      });

      return data;
    },

    initialize: function() {
      if (!this.options.widgetOptions) {
        this.options.widgetOptions = {};
      }
    }
  });
});
