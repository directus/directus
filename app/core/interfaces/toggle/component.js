define(['./interface', 'core/UIComponent', 'core/t'], function(Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'toggle',
    dataTypes: ['TINYINT'],
    variables: [
      {id: 'read_only', ui: 'toggle', default_value: false},
      {id: 'label', ui: 'text_input', default_value: ''},
      {id: 'show_as_checkbox', ui: 'toggle', default_value: false, comment: 'Display a checkbox instead of the default switch'}
    ],
    Input: Input,
    validate: function (value, options) {
      var required = options.schema.isRequired();
      if ((required && _.isEmpty(value)) || (required && +value === 0)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var listTemplateSource = '<input type="checkbox" class="custom-checkbox" {{#if selected}}checked="true"{{/if}} disabled>';

      return this.compileView(listTemplateSource, {selected: parseInt(options.value, 10) === 1});
    }
  });
});
