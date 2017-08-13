define(['underscore', 'core/RightPane'], function (_, RightPane) {

  return RightPane.extend({

    isWide: true,

    shouldOpen: function () {
      if (this.model) {
        return !_.result(this.model, 'isNew');
      }

      return true;
    },

    constructor: function (options) {
      RightPane.prototype.constructor.apply(this, arguments);

      this.state.wide = true;
    }
  });
});
