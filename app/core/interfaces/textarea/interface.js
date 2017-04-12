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
