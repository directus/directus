//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'wysiwyg';
  Module.dataTypes = ['VARCHAR', 'TEXT'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'bold', ui: 'checkbox'},
    {id: 'italic', ui: 'checkbox'},
    {id: 'underline', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label>'+
                  '<div class="btn-group btn-group-action active">'+
                    '{{#if bold}}<button type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Bold">Bold</button>{{/if}}'+
                    '{{#if italic}}<button type="button" class="btn btn-small btn-silver" data-tag="italic" rel="tooltip" data-placement="bottom" title="Italic">Italic</button>{{/if}}'+
                    '{{#if underline}}<button type="button" class="btn btn-small btn-silver" data-tag="underline" rel="tooltip" data-placement="bottom" title="Underline">Underline</button>{{/if}}'+
                  '</div>'+
                  '<div class="force-editable" style="display:block; height:{{height}}px;" contenteditable="true" id="{{name}}">{{value}}</div>'+
                  '<input type="hidden" name="{{name}}" value="{{value}}">';

//<span class="glyphicon-eye-close"></span>

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'focus input': function() { this.$el.find('.label').show(); },
      'keyup input': 'updateMaxLength',
      'blur input': function() { this.$el.find('.label').hide(); },
      'click button' : function(e) {
        var tag = $(e.target).attr('data-tag');
        document.execCommand(tag,false,null);
      },
      'onchange div.force-editable' : function(e) {
        console.log('test', e);
      }
    },

    updateMaxLength: function(e) {
      var length = this.options.schema.get('char_length') - e.target.value.length;
      this.$el.find('.label').html(length);
    },

    afterRender: function() {
      if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      console.log("bold", this.options.settings.get('bold'));
      return {
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '100',
        bold: (this.options.settings && this.options.settings.has('bold')) ? this.options.settings.get('bold') : false,
        italic: (this.options.settings && this.options.settings.has('italic')) ? this.options.settings.get('italic') : false,
        underline: (this.options.settings && this.options.settings.has('underline')) ? this.options.settings.get('underline') : false,
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.length,
        note: this.options.schema.get('comment')
      };
    },

    fix_onChange_editable_elements: function(){
      var editable = document.querySelectorAll('div[contentEditable]');

      for (var i=0, len = editable.length; i<len; i++){
        console.log("Z");
        editable[i].setAttribute('data-orig',editable[i].innerHTML);

        editable[i].onblur = function(){
          if (this.innerHTML == this.getAttribute('data-orig')) {
            // no change
          } else {
            // change has happened, store new value
            this.setAttribute('data-orig',this.innerHTML);
          }
        };
      }
    },

    initialize: function() {
      this.fix_onChange_editable_elements();
    }

  });

  Module.validate = function(value) {
    return true;
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});