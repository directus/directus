//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'underscore', 'core/UIComponent', 'core/UIView', 'core/t', 'utils', 'select2'],function(app, _, UIComponent, UIView, __t, Utils) {

  'use strict';

  var template = '<div class="select-container"> \
                    <select name="{{name}}" {{#if readonly}}disabled{{/if}}>{{#if allow_null}}<option value="">{{placeholder_text}}</option>{{/if}}{{#options}}<option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option>{{/options}}</select> \
                  </div>';

  var SHOW_SELECT_OPTIONS = {
    text: __t('select_ui_show_options_text'),
    value: __t('select_ui_show_options_value')
  };

  var parseOptions = function (options) {
    if (_.isString(options)) {
      try {
        options = $.parseJSON(options);
      } catch (e) {
        options = {};
        console.error(e);
      }
    }

    return options;
  };

  var Input = UIView.extend({
    templateSource: template,

    serialize: function() {
      var selectedValue = this.options.value;
      var options = this.options.settings.get('options');

      // if selectedValue is null
      // we use the schema default value
      // it should not be undefined.
      if (selectedValue === null) {
        selectedValue = this.options.schema.get('default_value');
      }

      options = parseOptions(options);

      options = _.map(options, function(value, key) {
        var item = {};

        item.value = value;
        item.key = key;
        item.selected = (item.key == selectedValue);

        return item;
      });

      return {
        options: options,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        allow_null: this.options.settings.get('allow_null') === true,
        display_search: this.options.settings.get('display_search'),
        auto_search_limit: this.options.settings.get('auto_search_limit'),
        placeholder_text: (this.options.settings.get('placeholder_text')) ?  this.options.settings.get('placeholder_text') : __t('select_from_below')
      };
    },
    initialize: function() {
      var isMobile = navigator.userAgent.match(/(iP(hone|od|ad)|Android|IEMobile)/);
      if (!isMobile) {
        var self = this;
        setTimeout(function () {
          var options = {
            placeholder: self.options.settings.get('placeholder_text')
          };
          if (self.options.settings.get('display_search') === 'auto') {
            options.minimumResultsForSearch = self.options.settings.get('auto_search_limit') || 10;
          } else if (self.options.settings.get('display_search') === 'never') {
            options.minimumResultsForSearch = Infinity;
          }
          if (self.options.settings.get('allow_null')) {
            options.allowClear = true;
          }
          self.$el.find("select").select2(options);
        }, 0);
      }
    }
  });

  var Component = UIComponent.extend({
    id: 'select',
    dataTypes: ['VARCHAR', 'INT'],
    variables: [
      {id: 'options', default_value: '', ui: 'textarea', options:{'rows': 25, 'placeholder_text': "{\n    \"value1\":\"Option One\",\n    \"value2\":\"Option Two\",\n    \"value3\":\"Option Three\"\n}"}, comment: __t('select_options_comment')},
      {id: 'allow_null', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'display_search', type: 'String', default_value: 'auto', required: true, ui: 'select', options: {options: {'auto':__t('Auto'),'always':__t('Always'),'never':__t('Never')} }},
      {id: 'auto_search_limit', type: 'Number', ui: 'numeric', char_length: 20, default_value: 10, comment: __t('select_auto_search_limit_text')},
      {id: 'show', type: 'String', default_value: 'value', ui: 'select', options: {options: SHOW_SELECT_OPTIONS}},
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 255, required: false, comment: __t('select_placeholder_text')}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      var value = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : options.value;

      if (options.settings.get('show') === 'text') {
        options = parseOptions(options.settings.get('options'));

        value = options[value];
      }

      return value;
    }
  });

  return Component;
});
