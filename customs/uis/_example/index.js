define(['core/UIComponent', 'core/BaseUIView'], function(UIComponent, UIView) {
  var charactersLimit = 100;
  var Input = UIView.extend({
    template: '_example/templates/input',
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

  var Component = UIComponent.extend({
    id: 'textlimit',
    dataTypes: ['TEXT'],
    Input: Input
  });


  return Component;
});
