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

    hiddenFields: [
      'id',
      'active',
      'sort'
    ],

    beforeRender: function() {
      var structure = this.structure;
      var UI = ui.initialize({model: this.model, structure: structure});

      // @todo: would probably be cleaner to filter this first instead of doing it on the fly
      structure.each(function(column) {
        if (!_.contains(this.hiddenFields, column.id)) {
          var view = UI.getInput(column.id);
          //@todo: move this to UI
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
      // Allows us to exclude certain inputs, i.e. w/in custom uis, which don't
      // map to an actual record field, and which shouldn't be posted.
      this.$el.find('.serialize-exclude').attr('disabled','disabled');
      var data = this.$el.serializeObject();
      this.$el.find('.serialize-exclude').removeAttr('disabled');
      return data;
    },

    initialize: function(options) {
      var structureHiddenFields;
      var optionsHiddenFields = options.hiddenFields || [];

      this.structure = this.options.structure || this.model.collection.structure;

      // Hide fields defined as hidden in the schema
      structureHiddenFields = this.structure.chain()
                                .filter(function(column) { return column.get('hidden_input'); })
                                .pluck('id')
                                .value();

      this.hiddenFields = _.union(
                            optionsHiddenFields,
                            structureHiddenFields,
                            this.hiddenFields
                          );

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