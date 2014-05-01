//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'wysiwyg';
  Module.dataTypes = ['VARCHAR', 'TEXT'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'height', ui: 'numeric', def: '500'},
    {id: 'bold', ui: 'checkbox', def: '1'},
    {id: 'italic', ui: 'checkbox', def: '1'},
    {id: 'underline', ui: 'checkbox', def: '1'},
    {id: 'strikethrough', ui: 'checkbox', def: '1'},
    //{id: 'rule', ui: 'checkbox', def: '1'},
    {id: 'createlink', ui: 'checkbox', def: '1'},
    {id: 'insertimage', ui: 'checkbox', def: '1'}
  ];

   Handlebars.registerHelper('newlineToBr', function(text){
       return new Handlebars.SafeString(text.string.replace(/\n/g, '<br/>'));
   });

  var template =  '<div id="wysihtml5-toolbar-{{name}}" style="display: none;"> \
                    {{#if bold}}<a data-wysihtml5-command="bold">bold</a>{{/if}} \
                    {{#if italic}}<a data-wysihtml5-command="italic">italic</a>{{/if}} \
                    {{#if underline}}<a data-wysihtml5-command="underline">underline</a>{{/if}} \
                    {{#if strikethrough}}<a data-wysihtml5-command="strikethrough">strikethrough</a>{{/if}} \
                    {{#if createlink}} \
                      <a data-wysihtml5-command="createLink">insert link</a> \
                      <div data-wysihtml5-dialog="createLink" style="display: none;"> \
                        <label> \
                          Link: \
                          <input data-wysihtml5-dialog-field="href" value="http://" class="text"> \
                        </label> \
                        <a data-wysihtml5-dialog-action="save">OK</a> <a data-wysihtml5-dialog-action="cancel">Cancel</a> \
                      </div> \
                    {{/if}} \
                    {{#if insertimage}} \
                      <a data-wysihtml5-command="insertImage">insert image</a> \
                      <div data-wysihtml5-dialog="insertImage"  style="display: none;"> \
                        <label> \
                          Image: \
                          <input data-wysihtml5-dialog-field="src" value="http://"> \
                        </label> \
                        <a data-wysihtml5-dialog-action="save">OK</a> \
                        <a data-wysihtml5-dialog-action="cancel">Cancel</a> \
                      </div> \
                    {{/if}} \
                  </div> \
                  <form><textarea id="wysihtml5-textarea-{{name}}" style="height:{{height}}px" placeholder="Enter your text ..." value="{{markupValue}} autofocus></textarea></form> \
                  <input type="hidden" name="{{name}}" value="{{markupValue}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'input textarea' : 'textChanged'
    },

    textChanged: function(view) {
      view.$('input').val(view.editor.getValue());
    },

    afterRender: function() {
      if (this.options.settings.get("readonly") === "on") this.editor.readonly();
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      return {
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '100',
        bold: (this.options.settings && this.options.settings.has('bold')) ? this.options.settings.get('bold') : true,
        italic: (this.options.settings && this.options.settings.has('italic')) ? this.options.settings.get('italic') : true,
        underline: (this.options.settings && this.options.settings.has('underline')) ? this.options.settings.get('underline') : true,
        strikethrough: (this.options.settings && this.options.settings.has('strikethrough')) ? this.options.settings.get('strikethrough') : true,
        rule: (this.options.settings && this.options.settings.has('rule')) ? this.options.settings.get('rule') : true,
        createlink: (this.options.settings && this.options.settings.has('createlink')) ? this.options.settings.get('createlink') : true,
        insertimage: (this.options.settings && this.options.settings.has('insertimage')) ? this.options.settings.get('insertimage') : true,
        markupValue: String(value).replace(/"/g, '&quot;'),
        value: new Handlebars.SafeString(value),
        name: this.options.name,
        maxLength: length,
        characters: length - value.length
      };
    },

    initialize: function() {
      var bLoaded = false;
      var that = this;
      $.ajax({
        url: "//raw.githubusercontent.com/xing/wysihtml5/master/parser_rules/advanced.js",
        dataType: "script",
        success: function() {
          if(bLoaded) {
            that.initEditor();
          }
          bLoaded = true;
        }
      });

      $.ajax({
        url: "//cdn.jsdelivr.net/wysihtml5/0.3.0/wysihtml5-0.3.0.min.js",
        dataType: "script",
        success: function() {
          if(bLoaded) {
            that.initEditor();
          }
          bLoaded = true;
        }
      });
    },

    initEditor: function() {
      var that = this;
      this.editor = new wysihtml5.Editor("wysihtml5-textarea-" + this.options.name, { // id of textarea element
        toolbar:      "wysihtml5-toolbar-" + this.options.name, // id of toolbar element
        parserRules:  wysihtml5ParserRules // defined in parser rules set
      });
      var value = this.options.value || '';
      this.editor.setValue(String(value).replace(/"/g, '&quot;'));
      this.editor.on('change', function() {
        that.textChanged(that);
      });
    }
  });

  Module.validate = function(value) {

  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?!br\s*\/?)[^>]+>/g, '').substr(0,100) : '';
  };

  return Module;

});