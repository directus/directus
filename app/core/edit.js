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

      var parent = false;
      // fixes https://github.com/RNGR/directus6/issues/204
      if(this.model.hasOwnProperty('collection') && this.model.collection.hasOwnProperty('parent'))
        parent = this.model.collection.parent;

      var sameAsParent = false;
      var relatedTable;
      var meta;

      structure.each(function(column) {
        meta = structure.get(column);
        relatedTable = (meta.get('ui') === 'many_to_one') ? meta.options.get('table_related') : meta.get('table_related');

        sameAsParent = parent && (relatedTable === parent.collection.table.id);

        if (!column.get('hidden_input') && (column.id !== 'id') && (column.id !== 'active') && (column.id !== 'sort') && !sameAsParent) {
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
        // reset changes!
        this.model.changed = {};
        this.render();
      }, this);
    }

  });

  return EditView;
});