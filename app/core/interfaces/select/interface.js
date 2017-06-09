//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['underscore', 'core/UIView', 'core/t', 'select2'], function (_, UIView, __t, select2) {
  'use strict';

  var parseOptions = function (options) {
    if (_.isString(options)) {
      try {
        options = JSON.parse(options);
      } catch (err) {
        options = {};
        console.error(err);
      }
    }

    return options;
  };

  return UIView.extend({
    template: 'select/input',

    events: {
      'change select': 'onChangeSelect',
      'change input[type=radio]': 'onChangeRadio',
      'change input[type=checkbox]': 'updateCheckboxValue'
    },

    onChangeSelect: function (event) {
      var $select = $(event.currentTarget);
      var values = [];

      $select.find('option:selected').each(function () {
        values.push(this.value);
      });

      this.model.set(this.name, values.join(this.options.settings.get('delimiter')));
    },

    onChangeRadio: function (event) {
      this.model.set(this.name, event.currentTarget.value);
    },

    updateCheckboxValue: function () {
      var values = this.$('input[type=checkbox]:checked');
      var out = '';

      if (values.length > 0) {
        for (var i = 0; i < values.length; i++) {
          out += values[i].value + this.options.settings.get('delimiter');
        }

        out = out.substr(0, out.length - 1);
      }

      this.$('input').val(out);
      this.model.set(this.name, out);
    },

    serialize: function () {
      var value = this.options.value || '';
      var values = value.split(this.options.settings.get('delimiter'));
      var options = this.options.settings.get('options');
      var defaultValue = this.columnSchema.get('default_value');
      var hasSelectedValue = false;

      options = parseOptions(options);

      options = _.map(options, function (value, key) {
        var item = {};
        var selected = _.indexOf(values, key) >= 0;

        if (selected) {
          hasSelectedValue = true;
        }

        item.value = value;
        item.key = key;
        item.selected = selected;

        return item;
      });

      if (!hasSelectedValue) {
        this.model.set(this.name, defaultValue);
      }

      return {
        options: options,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        allow_null: this.options.settings.get('allow_null') === true,
        display_search: this.options.settings.get('display_search'),
        auto_search_limit: this.options.settings.get('auto_search_limit'),
        placeholder_text: (this.options.settings.get('placeholder_text')) ? this.options.settings.get('placeholder_text') : __t('select_from_below'),
        select_type: this.options.settings.get('input_type') === 'dropdown',
        multiselect: this.options.settings.get('select_multiple') === true,
        value: value
      };
    },

    initialize: function () {
      var isMobile = navigator.userAgent.match(/(iP(hone|od|ad)|Android|IEMobile)/);

      if (!isMobile) {
        var self = this;

        setTimeout(function () {
          var options = {
            placeholder: self.options.settings.get('placeholder_text'),
            multiple: self.options.settings.get('select_multiple'),
            width: '100%'
          };

          if (self.options.settings.get('display_search') === 'auto') {
            options.minimumResultsForSearch = self.options.settings.get('auto_search_limit') || 10;
          } else if (self.options.settings.get('display_search') === 'never') {
            options.minimumResultsForSearch = Infinity;
          }

          if (self.options.settings.get('allow_null')) {
            options.allowClear = true;
          }

          self.$el.find('select').select2(options);
        }, 0);
      }
    }
  });
});
