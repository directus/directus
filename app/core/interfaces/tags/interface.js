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
        // Check actual key values to prevent issues
        //   with non-latin keyboards which use different
        //   key codes
        if (_.contains(['Enter', ','], event.key)) {
          event.stopPropagation();
          event.preventDefault();

          this.insertTag();
        }
      },
      'click .tag': function (event) {
        var $target = $(event.currentTarget);
        var index = this.$('.tag').index($target);

        //return if the widget is read only ( Do not remove tag )
        if (this.$('#tag-input').is('[readonly]')) {
            return;
        }

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
      var maxItems = Number(this.options.settings.get('max_items'));
      if(this.tags.length == maxItems) {
    	  this.render().$('#tag-input').prop( "disabled", true);
      } else {
    	  this.render().$('#tag-input').prop( "disabled", false).focus();      	  
      }
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
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        tags: this.tags,
        comment: this.options.schema.get('comment'),
        placeholder: this.options.settings.get('placeholder')
      };
    },

    initialize: function () {
      this.tags = this.options.value ? this.options.value.split(',') : [];
    }
  });
});
