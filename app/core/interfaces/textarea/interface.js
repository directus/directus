//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'core/UIView'
],function(UIView) {

  'use strict';

  return UIView.extend({
    template: 'textarea/input',

    events: {
      'keydown textarea': 'onKeyDown',
      'input textarea': 'onChange'
    },

    onKeyDown: function (event) {
      var key = event.keyCode || event.which;

      if (key == 13) {
        event.stopPropagation();
      }
    },

    onChange: function (event) {
      var target = event.currentTarget;

      this.model.set(this.name, target.value);
    },

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        rows: this.options.settings.get('rows'),
        placeholder_text: this.options.settings.get('placeholder_text'),
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }
  });
});
