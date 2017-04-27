define(['core/UIView', 'core/interfaces/wysiwyg/vendor/medium-editor.min'], function (UIView, MediumEditor) {
  return UIView.extend({
    template: 'wysiwyg/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        value: value,
        name: this.options.name
      };
    },
    afterRender: function () {
      console.log(this.options.settings.get('buttons').split(','));
      var editor = new MediumEditor('#wysiwyg-interface_' + this.options.name, {
        toolbar: {
          buttons: this.options.settings.get('buttons').split(',')
        }
      });
    }
  });
});
