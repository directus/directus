define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'json',
    dataTypes: ['TEXT', 'VARCHAR'],
    Input: Input,
    variables: [
      {id: 'indent', default_value: '\t', ui: 'textinput'},
      {id: 'rows', type: 'Number', default_value: 12, ui: 'numeric', char_length: 3},
      {id: 'placeholder_text', default_value: '', type: 'String', ui: 'textinput', char_lenth: 200}
    ],
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required')
      }

      try {
        JSON.parse(value);
      } catch(err) {
        return err;
      }
    },
    list: function(options) {
      return _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });
});
