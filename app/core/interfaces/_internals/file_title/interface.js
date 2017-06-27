/* global $ */
define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: '_internals/file_title/input',

    events: {
      'focus input': function () {
        this.$el.find('.char-count').removeClass('hide');
      },
      'input input': 'onChangeInput',
      'blur input': function () {
        this.$el.find('.char-count').addClass('hide');
      }
    },

    onChangeInput: function (event) {
      var $input = $(event.currentTarget);

      this.model.set(this.options.name, $input.val());

      this.updateMaxLength($input.val().length);
    },

    updateMaxLength: function (length) {
      this.$el.find('.char-count').html(this.options.schema.get('char_length') - length);
    },

    serialize: function () {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      var readonly = false;

      return {
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readonly: readonly
      };
    }
  });
});
