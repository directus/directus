define(['core/RightPane'], function (RightPane) {

  return RightPane.extend({

    constructor: function (options) {
      RightPane.prototype.constructor.apply(this, arguments);

      this.state.wide = true;
    }
  });
});
