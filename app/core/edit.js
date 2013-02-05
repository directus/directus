define([
  "app",
  "backbone"
],

function(app, Backbone) {

  var EditView = Backbone.Layout.extend({

    tagName: "form",

    events: {
      'save': function() {
        console.log('save');
      }
    },

    beforeRender: function() {
      var structure = this.options.structure || this.model.collection.structure;
      var UI = ui.initialize({model: this.model, structure: structure});
      structure.each(function(column) {
        if (!column.get('hidden_input') && (column.id !== 'id') && (column.id !== 'active') && (column.id !== 'sort')) {
          this.insertView(UI.getInput(column.id));
        }
      }, this);
    },

    constructor: function (options) {
      Backbone.Layout.__super__.constructor.call(this, options);
      this.$el.addClass('directus-form');
      this.$el.attr('id','directus-form');
    },

    //Focus first input
    afterRender: function() {
      var $first = this.$el.find(':input:first:visible');
      $first.focus();
      $first.val($first.val());
    },

    save: function(data, success, error) {
      formData = this.$el.serializeObject();
      _.extend(formData, data);

      console.log(this.model.toJSON());

      this.model.save(formData, {
        success: success,
        error: error
      });
    },

    data: function() {
      return this.$el.serializeObject();
    },

    initialize: function() {
      this.model.on('sync', function(e) {
        this.render();
      }, this);
    }

  });

  return EditView;
});
