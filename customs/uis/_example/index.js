define(['core/UIComponent', 'core/CustomUIView'], function(UIComponent, UIView) {
  var charactersLimit = 100;
  var Input = UIView.extend({
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

  var Component = UIComponent.extend({
    id: 'exampletextlimit',
    dataTypes: ['TEXT'],
    Input: Input
  });


  return Component;
});
