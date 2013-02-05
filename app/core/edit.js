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
      console.log('re-n-der', this.cid, this.model);
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

    //Fix broken images
    afterRender: function() {
      $('img').error(function(){
        $(this).attr('src', 'assets/img/missing-image.png').removeClass();
      });
      //console.log($('.directus-form:input:visible:first'));
      var $first = this.$el.find(':input:first:visible');

      $first.focus();
      $first.val($first.val());
      //$('.directus-form:input:visible:first').focus();
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
      console.log(this.model);
      this.model.on('sync', function(e) {
        console.log('CYN');
        this.render();
      }, this);
    }

  });

  return EditView;
});
