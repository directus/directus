//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'core/UIView',
  'core/t'
], function(UIView, __t) {
  return UIView.extend({
    template: 'numeric/input',

    serialize: function() {
      var value = '';

      if(!isNaN(this.options.value)) {
        value = this.options.value;
      }

      // Fill in default value
      if (
        this.options.value === undefined &&
        this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      var step = 1;

      if (
        this.options.schema.get('type') === 'FLOAT' ||
        this.options.schema.get('type') === 'VARCHAR' ||
        this.options.schema.get('type') === 'CHAR'
      ) {
        step = 'any';
      }

      return {
        value: value,
        name: this.options.name,
        size: this.options.settings.get('size'),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder_text') : '',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        step: step
      };
    }
  });
});
