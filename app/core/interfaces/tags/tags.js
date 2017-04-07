//  Tags core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'underscore', 'utils', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, _, Utils, UIComponent, UIView, __t) {
  'use strict';

  var Input = UIView.extend({
    template: 'tags/input',

    events: {
      'keydown #tag-input': function(e) {
        // 188 = comma, 13 = enter
        if (e.keyCode === 188 || e.keyCode === 13) {
          e.preventDefault();
          this.insertTag();
        }
      },
      'click .tag': function(e) {
        var index = this.$el.find('.tag').index($(e.target));
        this.tags.splice(index,1);
        this.render();
      },
      'click button': 'insertTag'
    },

    insertTag: function() {
      var $input = this.$el.find('#tag-input');
      var data = $input.val();
      var force_lowercase = this.options.settings.get('force_lowercase') === true;
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
      {id: 'force_lowercase', type: 'Boolean', default_value: true, ui: 'checkbox'} // When on, all entered tags are converted to lowercase
      // TODO: Include spaces in CSV value
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      var tags = options.model.attributes.tags ? options.model.attributes.tags.split(',') : [];

      if(tags.length){
        for (var i = 0; i < tags.length; i++) {
          tags[i] = '<span class="tag">' + tags[i] + '</span>';
        }

        return '<span class="tag-container"><div class="fade-out"></div>' + tags.join(' ') + '</span>';
      } else {
        return options.model.attributes.tags;
      }
    }
  });

  return Component;
});
