//  Markdown UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'marked'],function(app, UIComponent, UIView, marked) {

  'use strict';

  var template = '<style type="text/css"> \
                  textarea.md-editor { \
                    margin-top:1em; \
                  }\
                  .md-editor-preview { \
                    padding: 1em;\
                    display: none; \
                  }\
                  </style> \
                  <div> \
                    <button class="btn btn-small active" type="button" data-action="md-edit">Editor</button> \
                    <button class="btn btn-small" type="button" data-action="md-preview">Preview</button> \
                  </div> \
                  <textarea rows="{{rows}}" class="md-editor" name="{{name}}" id="{{name}}" {{#if readonly}}readonly{{/if}}>{{rawValue}}</textarea> \
                  <div class="md-editor-preview">{{value}}</div>';

  var Input = UIView.extend({
    events: {
      'keyup': 'renderMarkdown',
      'change textarea.md-editor': 'renderMarkdown',
      'click button[data-action="md-preview"]': function (e) {
        this.$('.md-editor').hide();
        this.$('.md-editor-preview').show();
        this.$('.btn').removeClass('active');
        e.currentTarget.className += ' active';
      },
      'click button[data-action="md-edit"]': function (e) {
        this.$('.md-editor-preview').hide();
        this.$('.md-editor').show();
        this.$('.btn').removeClass('active');
        e.currentTarget.className += ' active';
      }
    },

    renderMarkdown: function() {
      var value = this.$('.md-editor').val();
      if (value) {
        this.$('.md-editor-preview').html(marked(value));
      }
    },

    templateSource: template,
    templateCompileOptions: { noEscape: true },

    initialize: function() {
      marked.setOptions({
        gfm: this.options.settings.get('github_flavored_markdown'),
        tables: this.options.settings.get('tables'),
        breaks: this.options.settings.get('breaks'),
        sanitize: this.options.settings.get('sanitize')
      });
    },

    serialize: function() {
      return {
        rawValue: this.options.value,
        value: (this.options.value) ? marked(this.options.value):'',
        name: this.options.name,
        rows: this.options.settings.get('rows'),
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'markdown',
    dataTypes: ['TEXT', 'VARCHAR'],
    variables: [
      {id: 'rows', type: 'Number', def: 14, ui: 'numeric', char_length: 3},
      {id: 'github_flavored_markdown', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'tables', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'breaks', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'sanitize', type: 'Boolean', def: false, ui: 'checkbox'}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      var raw_val = marked(options.value);

      return _.isString(raw_val) ? raw_val.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });

  return Component;
});
