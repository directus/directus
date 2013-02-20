//  Blob core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};

  var template = '<label>{{{capitalize name}}}</label>'+
                 '<input type="hidden" value="{{value}}" name="{{name}}" id="{{name}}">'+
                 '<input type="text" class="medium" id="tag-input"/><button class="btn btn-small btn-primary margin-left" type="button">Add</button>'+
                 '<div style="width:84%;">{{#tags}}<span class="label tag">{{this}}</span>{{/tags}}</div>';

  Module.id = 'tags';
  Module.dataTypes = ['VARCHAR','CHAR'];

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile( template),

    serialize: function() {
      //Filter out empty tags
      this.tags = _.filter(this.tags, function(tag) { return(tag !== ''); });
      return {value: this.tags.join(','), name: this.options.name, tags: this.tags};
    },

    events: {
      'keydown #tag-input': function(e) {
        if (e.keyCode === 188 || e.keyCode === 13) {
          e.preventDefault();
          this.insertTag();
        }
      },
      'click span': function(e) {
        var index = $('.tag').index($(e.target));
        this.tags.splice(index,1);
        this.render();
      },
      'click button': 'insertTag'
    },

    insertTag: function() {
      var $input = this.$el.find('#tag-input');
      var data = $input.val();
      if (this.tags.indexOf(data) === -1) {
        this.tags.push(data);
      }
      this.render().view.$el.find('#tag-input').focus();
    },

    initialize: function() {
      this.tags = this.options.value ? this.options.value.split(',') : [];
    }

  });

  Module.list = function(options) {
    return 'TAGS';
  };

  return Module;
});