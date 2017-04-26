define(['app', 'core/UIView'], function (app, UIView) {
  return UIView.extend({
    initialize: function () {
      var image = document.createElement('img');
      image.src = 'data:image/png;base64,' + this.options.value;
      this.$el.append('<label>' + app.capitalize(this.options.name) + '</label>');
      this.$el.append(image);
    }
  });
});
