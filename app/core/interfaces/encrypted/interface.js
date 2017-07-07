/* global $ _ */
define(['core/UIView', './lib/text-scrambler'], function (UIView, TextScrambler) {
  'use strict';

  return UIView.extend({
    template: 'encrypted/input',

    events: {
      'input input[name=encrypted-raw]': _.debounce(function (event) {
        this.hashValue(event.target.value);
      }, 500)
    },

    hashValue: function (value) {
      var that = this;

      var hasher = this.options.settings.get('hashing_type');
      var request = $.ajax({
        url: '/api/1.1/hash',
        method: 'post',
        data: {
          string: value,
          hasher: hasher
        }
      });

      request.done(function (response) {
        var result = response.data.hash;

        that.saveResult(result);
        that.displayResult(result);
      });

      request.fail(function (xhr, status, error) {
        console.error(status, error);
      });
    },

    saveResult: function (result) {
      this.model.set(this.name, result);
      this.$el.find('input[type=hidden]').value = result;
    },

    displayResult: function (result) {
      var fx = new TextScrambler(this.$el.find('.encrypted-result')[0]);

      fx.setText(result);

      this.$el.find('.encrypted-result')[0].innerHTML = result;
    },

    serialize: function () {
      var value = this.options.value || this.options.schema.get('default_value') || '';

      return {
        value: value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        hide: this.options.settings.get('hide_value'),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder') : ''
      };
    }
  });
});
