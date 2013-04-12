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
          var view = UI.getInput(column.id);
          view.$el.attr('id', 'edit_field_'+column.id);
          this.insertView(view);
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

/*
    Not in use
    save: function(data, success, error) {
      formData = this.$el.serializeObject();
      _.extend(formData, data);

      this.model.save(formData, {
        success: success,
        error: error
      });
    },
*/
    data: function() {
      return this.$el.serializeObject();
    },

    initialize: function() {
      this.model.on('invalid', function(model, errors) {
        _.each(errors, function(item) {
          $fieldset = $('#edit_field_' + item.attr);
          if ($fieldset.find('.error').length < 1) {
            $fieldset.append('<span class="error">'+item.message+'</span>');
          }
        });
      });
      this.model.on('sync', function(e) {
        this.render();
      }, this);
    }

  });

  return EditView;
});