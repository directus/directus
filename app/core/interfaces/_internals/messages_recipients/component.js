define(['./interface', 'core/UIComponent'], function (Input, UIComponent) {
  return UIComponent.extend({
    id: 'directus_messages_recipients',
    Input: Input,
    list: function () {
      return '';
    }
  });
});
