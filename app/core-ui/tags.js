//  Tags core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var template = '<input type="hidden" value="{{value}}" name="{{name}}" id="{{name}}"> \
                 <input type="text" class="medium" id="tag-input" style="margin-right:10px;" placeholder="Type tag then hit enter..."><button class="btn btn-primary margin-left" type="button">Add</button> \
                 <div style="width:84%;">{{#tags}}<span class="tag">{{this}}</span>{{/tags}}</div>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'keydown #tag-input': function(e) {
        // 188 = comma, 13 = enter
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
      var force_lowercase = (this.options.settings && this.options.settings.has('force_lowercase') && this.options.settings.get('force_lowercase') == '0') ? false : true;
      if(force_lowercase){
        data = data.toLowerCase();
      }
      var tempTags = data.split(",");
      for (var i = tempTags.length - 1; i >= 0; i--) {
        var thisTag = tempTags[i].trim();
        if (this.tags.indexOf(thisTag) === -1) {
          this.tags.push(thisTag);
        }
      }
      this.render().$el.find('#tag-input').focus();
    },

    serialize: function() {
      //Filter out empty tags
      this.tags = _.filter(this.tags, function(tag) { return(tag !== ''); });

      return {
        value: this.tags.join(','),
        name: this.options.name,
        tags: this.tags,
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function() {
      this.tags = this.options.value ? this.options.value.split(',') : [];
    }
  });

  var Component = UIComponent.extend({
    id: 'tags',
    dataTypes: ['TEXT','VARCHAR','CHAR'],
    variables: [
      // When on, all entered tags are converted to lowercase
      {id: 'force_lowercase', ui: 'checkbox', def: '1'}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      var tags = options.model.attributes.tags ? options.model.attributes.tags.split(',') : [];

      if(tags.length){
        for (var i = 0; i < tags.length; i++) {
          tags[i] = '<span class="tag-static">' + tags[i] + '</span>';
        }

        return tags.join(' ');
      } else {
        return options.model.attributes.tags;
      }
    }
  });

  return new Component();
});
