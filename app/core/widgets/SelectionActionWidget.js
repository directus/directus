define([
  'app',
  'backbone',
  'handlebars'
],
function(app, Backbone, Handlebars) {

  "use strict";

  return Backbone.Layout.extend({

    template: 'core/widgets/set-status',

    tagName: 'div',

    attributes: {
      class: 'select-container',
      id: 'batchStatus',
      style: 'display:inline-block;'
    },

    events: {
      'change .js-status': function(event) {
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
      // 'click #batchEditBtn': function(e) {
      //   var $checked = $('.js-select-row:checked');
      //   var ids = $checked.map(function() {
      //     return this.value;
      //   }).toArray().join();
      //
      //   var route = Backbone.history.fragment.split('/');
      //   route.push(ids);
      //   app.router.go(route);
      // }
    },

    doAction: function(value) {
      // var value = $(e.target).closest('li').attr('data-value');
      var collection = this.collection;
      var status = collection.getFilter('status');
      var $checked = $('.js-select-row:checked');
      var models = [];
      var actionCollection = collection.clone();

      actionCollection.reset();
      $checked.each(function() {
        var model = collection.get(this.value);
        var attributes = {};

        if (model.has(app.statusMapping.status_name)) {
          attributes[app.statusMapping.status_name] = parseInt(value);
          model.set(attributes);
        }

        actionCollection.add(model);
        models.push(model);
      });

      var success = function (model, resp, options) {
        collection.trigger('visibility');
        collection.trigger('select');
        options.remove = false;
        collection.trigger('sync', model, resp, options);
      };

      var options = {patch: true, validate: false, wait: true, success: success};
      app.changeCollectionStatus(actionCollection, value, options);
    },

    serialize: function() {
      var data = this.options.widgetOptions;
      var canDelete = this.collection.hasPermission('delete') || this.collection.hasPermission('bigdelete');
      var hasStatusColumn = this.collection.table.columns.get(app.statusMapping.status_name);
      var mapping = app.statusMapping.mapping;

      data.hasStatusColumn = hasStatusColumn;
      data.mapping = [];
      for (var key in mapping) {
        // Skip delete
        key = Number(key);
        if (key === app.statusMapping.deleted_num) {
          continue;
        }

        var entry = mapping[key];
        entry.id = key;
        data.mapping.push(entry);
      }

      data.mapping.sort(function(a, b) {
        return a.sort > b.sort;
      });

      return data;
    },

    // beforeRender: function() {
    //   this.stopListening(this.collection, 'select');
    //   this.listenTo(this.collection, 'select', function() {
    //     var batchEdit = $('.js-select-row:checked').length > 1;
    //     if(this.options.widgetOptions.batchEdit !== batchEdit) {
    //       this.options.widgetOptions.batchEdit = batchEdit;
    //       this.render();
    //     }
    //   }, this);
    // },

    initialize: function() {
      if (!this.options.widgetOptions) {
        this.options.widgetOptions = {};
      }
    }
  });
});
