define(['app', 'underscore', 'core/uis/select'], function (app, _, SelectInterface) {

  // set (forced) the countries list as select options
  function setOptions(options) {

    options.settings.set('options', app.countries);

    return options;
  }

  var originalInput = SelectInterface.prototype.Input;

  var Input = originalInput.extend({
    initialize: function () {
      originalInput.prototype.initialize.apply(this, arguments);

      this.options = setOptions(this.options);
    }
  });

  return SelectInterface.extend({
    id: 'countries',

    dataTypes: ['CHAR', 'VARCHAR'],

    variables: _.filter(SelectInterface.prototype.variables, function (variable) {
      return variable.id !== 'options';
    }),

    Input: Input,

    list: function (options) {
      options = setOptions(options);

      return SelectInterface.prototype.list.apply(this, [options]);
    }
  });
});
