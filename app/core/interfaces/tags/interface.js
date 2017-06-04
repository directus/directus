//  Tags core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'underscore',
  'core/UIView'
], function(_, UIView) {
  'use strict';

  return UIView.extend({
    template: 'tags/input',

    events: {
      'keydown #tag-input': function (event) {
        // 188 = comma, 13 = enter
        if (_.contains([188, 13], event.keyCode)) {
          event.preventDefault();

          this.insertTag();
        }
      },
      'click .tag': function (event) {
        var $target = $(event.currentTarget);
        var index = this.$('.tag').index($target);

        this.tags.splice(index, 1);
        this.model.set(this.name, this.getTagsValue());
        this.render();
      },
      'click button': 'insertTag'
    },

    insertTag: function() {
      var $input = this.$('#tag-input');
      var data = $input.val();
      var force_lowercase = this.options.settings.get('force_lowercase') === true;
      var tempTags;

      if (force_lowercase) {
        data = data.toLowerCase();
      }

      tempTags = data.split(',');
      for (var i = tempTags.length - 1; i >= 0; i--) {
        var thisTag = tempTags[i].trim();

        if (this.tags.indexOf(thisTag) === -1) {
          this.tags.push(thisTag);
        }
      }

      this.model.set(this.name, this.getTagsValue());
      this.render().$('#tag-input').focus();
    },

    getTagsValue: function () {
      // Filter out empty tags
      this.tags = _.filter(this.tags, function (tag) {
        return tag !== '';
      });

      return this.tags.join(',');
    },

    serialize: function () {
      return {
        value: this.getTagsValue(),
        name: this.options.name,
        tags: this.tags,
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function () {
      this.tags = this.options.value ? this.options.value.split(',') : [];
    }
  });
});
