//  Markdown UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', '../assets/js/libs/marked.min.js'],function(app, Backbone, marked) {

  "use strict";

  var Module = {};

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

  Module.id = 'markdown';
  Module.dataTypes = ['TEXT', 'VARCHAR'];

  Module.variables = [
    {id: 'rows', ui: 'numeric', char_length: 3, def: '14'},
    {id: 'github_flavored_markdown', ui: 'checkbox'},
    {id: 'tables', ui: 'checkbox'},
    {id: 'breaks', ui: 'checkbox'},
    {id: 'sanitize', ui: 'checkbox'}
  ];


  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field markdown-preview'
    },

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
//      console.log(marked.defaults);
      var value = this.$('.md-editor').val();
      if (value) {
        this.$('.md-editor-preview').html(marked(value));
      }
    },

    template: Handlebars.compile(template, { noEscape: true }),

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
        rows: (this.options.settings && this.options.settings.has('rows')) ? this.options.settings.get('rows') : '14',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value)) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    var raw_val = marked(options.value);
    var val = _.isString(raw_val) ? raw_val.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    return val;
  };

  return Module;
});
