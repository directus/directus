define(['core/interfaces/checkbox/interface', 'core/UIComponent', 'core/t'], function(Input, UIComponent, __t) {

  'use strict';

  return UIComponent.extend({
    id: 'checkbox',
    dataTypes: ['TINYINT'],
    variables: [
      {id: 'mandatory', type: 'Boolean', default_value: false, ui: 'checkbox', comment: 'if this field should always be checked by the user.'}
    ],
    Input: Input,
    validate: function (value, options) {
      // If a checkbox is mandatory, it MUST be checked to save
      // similar to "agree to terms" functionality
      var required = options.view ? options.view.isRequired() : false;
      if (required && value === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var listTemplateSource = '<input type="checkbox" class="custom-checkbox" {{#if selected}}checked="true"{{/if}} disabled><label><span></span></label>';

      return this.compileView(listTemplateSource, {selected: parseInt(options.value, 10) === 1});
    }
  });
});
