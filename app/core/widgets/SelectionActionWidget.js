define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <ul class="tools left big-space"> \
        <li class="tool"><span data-value="1" class="action actionBtn">Active</span></li> \
        <li class="tool"><span data-value="2" class="action actionBtn inactive">Draft</span></li> \
        <li class="tool div-right"><span data-value="0" class="action actionBtn delete">Delete</span></li> \
        {{#if batchEdit}} \
        <li class="tool"><span id="batchEditBtn" class="action">Batch Edit</span></li> \
        {{/if}} \
      </ul> \
    '),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    events: {
      'click .actionBtn': function(e) {
        var value = $(e.target).closest('span').attr('data-value');

        var collection = this.collection;

        var $checked = $('.select-row:checked');
        var expectedResponses = $checked.length;

        var success = function() {
          expectedResponses--;
          if (expectedResponses === 0) {
            collection.trigger('visibility');
            collection.trigger('select');
          }
        };

        $checked.each(function() {
          var id = this.value;
          console.log(id);
          var model = collection.get(id);
          model.save({active: value}, {silent: true, patch:true, validate:false, success: success});
        });
      },
      'click #batchEditBtn': function(e) {
        var $checked = $('.select-row:checked');
        var ids = $checked.map(function() {
          return this.value;
        }).toArray().join();

        var route = Backbone.history.fragment.split('/');
        route.push(ids);
        app.router.go(route);
      }
    },

    serialize: function() {
      return this.options.widgetOptions;
    },
    initialize: function() {
      if(!this.options.widgetOptions) {
        this.options.widgetOptions = {};
      }
      this.collection.on('select', function() {
        var batchEdit = $('.select-row:checked').length > 1;
        if(this.options.widgetOptions.batchEdit != batchEdit) {
          this.options.widgetOptions.batchEdit = batchEdit;
          this.render();
        }
      }, this);
    }
  });
});