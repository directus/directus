define([
  'core/UIView',
  'marked'
], function (UIView, marked) {
  'use strict';

  return UIView.extend({
    template: 'markdown/input',

    events: {
      keyup: 'renderMarkdown',
      'change textarea.md-editor': 'renderMarkdown',
      'click button[data-action="md-preview"]': function (event) {
        this.$('.md-editor').hide();
        this.$('.md-editor-preview').show();
        this.$('.btn').removeClass('active');

        event.currentTarget.className += ' active';
      },
      'click button[data-action="md-edit"]': function (event) {
        this.$('.md-editor-preview').hide();
        this.$('.md-editor').show();
        this.$('.btn').removeClass('active');

        event.currentTarget.className += ' active';
      }
    },

    renderMarkdown: function () {
      var value = this.$('.md-editor').val();
      var newValue = '';

      if (value) {
        newValue = marked(value);
      }

      // NOTE: Save raw markdown value
      this.model.set(this.name, value);
      this.$('.md-editor-preview').html(newValue);
    },

    initialize: function () {
      marked.setOptions({
        gfm: this.options.settings.get('github_flavored_markdown'),
        tables: this.options.settings.get('tables'),
        breaks: this.options.settings.get('breaks'),
        sanitize: this.options.settings.get('sanitize')
      });
    },

    serialize: function () {
      return {
        rawValue: this.options.value,
        value: this.options.value ? marked(this.options.value) : '',
        name: this.options.name,
        rows: this.options.settings.get('rows'),
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        always_show_preview: this.options.settings.get('always_show_preview')
      };
    }
  });
});
