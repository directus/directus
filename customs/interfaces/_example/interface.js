define(['core/CustomUIView'], function (UIView) {

  var charactersLimit = 100;

  return UIView.extend({
    template: 'example/templates/input',
    events: {
      'keyup textarea': 'updateCount'
    },
    updateCount: function(event) {
      var textLength = event.currentTarget.value.length;
      var textRemaining = charactersLimit - textLength;
      this.$el.find('#count').text(textRemaining);
    },
    serialize: function() {
      return {
        maxLength: charactersLimit,
        charactersRemaining: charactersLimit
      }
    }
  });
});
