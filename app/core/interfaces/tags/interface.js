//  Tags core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'underscore',
  'core/UIView',
  'core/t'
], function(_, UIView, __t) {
  'use strict';

  return UIView.extend({
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
});
