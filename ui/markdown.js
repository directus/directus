//  Markdown UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', '../assets/js/libs/marked.min.js'],function(app, Backbone, marked) {

  "use strict";

  var Module = {};

  var template = '<textarea rows="{{rows}}" class="markdown" name="{{name}}" id="{{name}}" {{#if readonly}}readonly{{/if}}>{{rawValue}}</textarea><h3>Preview</h3><div class="preview">{{value}}</div>';

  Module.id = 'markdown';
  Module.dataTypes = ['TEXT', 'VARCHAR'];

  Module.variables = [
    {id: 'rows', ui: 'numeric', char_length: 3},
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
      'change textarea.markdown': 'renderMarkdown'
    },

    renderMarkdown: function() {
      marked.setOptions({
        gfm: !!+this.options.settings.get('github_flavored_markdown'),
        tables: !!+this.options.settings.get('tables'),
        breaks: !!+this.options.settings.get('breaks'),
        sanitize: !!+this.options.settings.get('sanitize')
      });

      console.log(marked.defaults);
      var value = marked(this.$('textarea').val());
      this.$('.preview').html(value);
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
        value: marked(this.options.value),
        name: this.options.name,
        rows: (this.options.settings && this.options.settings.has('rows')) ? this.options.settings.get('rows') : '12',
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
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    return val;
  };

  return Module;
});
