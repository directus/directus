//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'core/t', 'select2'], function (app, UIComponent, UIView, __t) {
  'use strict';

  return UIView.extend({
    template: 'enum/input',

    serialize: function () {
      var selectedValue = this.options.value;

      var enumText = this.options.schema.attributes.column_type;
      enumText = enumText.substr(5, enumText.length - 6); // Remove enum() from string
      enumText = enumText.replace(/'/g, '');
      var enumArray = enumText.split(',');

      enumArray = _.map(enumArray, function (value) {
        var item = {};
        item.value = value;
        item.selected = (item.value === selectedValue);
        return item;
      });

      return {
        value: this.options.value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        allowNull: Boolean(this.options.settings.get('allow_null')),
        readonly: !this.options.canWrite,
        options: enumArray
      };
    },
    initialize: function () {
      var isMobile = navigator.userAgent.match(/(iP(hone|od|ad)|Android|IEMobile)/);
      if (!isMobile) {
        var self = this;
        setTimeout(function () {
          var options = {
            placeholder: self.options.settings.get('placeholder_text'),
            minimumResultsForSearch: Infinity
          };
          self.$el.find('select').select2(options);
        }, 0);
      }
    }
  });
});
