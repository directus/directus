//  Checkbox core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['underscore', 'utils', 'core/UIView', 'core/t'], function(_, Utils, UIView, __t) {
  'use strict';

  return UIView.extend({
    template: 'checkbox/input',

    events: {
      'change input[type=checkbox]': function(e) {
        var val = (this.$el.find('input[type=checkbox]:checked').val() === undefined) ? 0 : 1;
        this.$el.find('input[type=hidden]').val(val);
      }
    },

    isRequired: function() {
      var settings = this.options.settings;

      return settings.get('mandatory') === true;
    },

    serialize: function() {
      var value = this.options.value;

      // Get default value if there is one...
      if (value === undefined && this.options.schema.has('default_value')) {
        value = this.options.schema.get('default_value');
      }

      if (!_.isBoolean(value)) {
        value = Utils.convertToBoolean(value);
      }

      return {
        name: this.options.name,
        // Hotfix: We can't tell on the server if this option is a string or an actual number
        // TODO: Add a new field into `directus_ui` that state the type of the value
        selected: (value === true),
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }
  });
});
