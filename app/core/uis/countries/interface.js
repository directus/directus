define(['app', 'underscore', 'core/uis/select'], function (app, _, SelectInterface) {

  var originalInput = SelectInterface.prototype.Input;

  var Input = originalInput.extend({
    initialize: function () {
      originalInput.prototype.initialize.apply(this, arguments);

      this.options.settings.set('options', app.countries);
    }
  });

  return SelectInterface.extend({
    id: 'countries',
    dataTypes: ['CHAR', 'VARCHAR'],
    variables: _.filter(SelectInterface.prototype.variables, function (variable) {
      return variable.id !== 'options';
    }),
    Input: Input
  });
});
