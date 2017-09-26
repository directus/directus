define(['core/CustomUIView', 'utils'], function (UIView, Utils) {

  'use strict';

  return UIView.extend({
    template: 'rating/input',
    events: {
      'change [type="radio"]': 'onChange'
    },
    unsavedChange: function () {
      var hasValue = Utils.isSomething(this.value);
      var isNullable = this.columnSchema.isNullable();

      if ((hasValue || this.value === null && isNullable)  && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return this.value;
      }
    },
    onChange: function (event) {
      this.value = event.currentTarget.value;
      this.model.set(this.name, this.value);
    },
    serialize: function () {
      var value = this.options.value;

      // This is needed because Handlebars doesn't have a for loop equivalent
      var scoresArray = [];
      for (var i = this.options.settings.get('max_score'); i > 0; i--) {
        scoresArray.push({
          i: i,
          checked: i === value
        });
      }

      return {
        value: value,
        amount: scoresArray,
        name: this.options.name,
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function (options) {
      this.value = options.value !== undefined ? options.value : options.default_value;
    }
  });
});

