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
    {id: 'rule', ui: 'checkbox', def: '1'},
    {id: 'createlink', ui: 'checkbox', def: '1'},
    {id: 'insertimage', ui: 'checkbox', def: '1'},
    {id: 'plaintextpaste', ui: 'checkbox', def: '1'}
  ];

   Handlebars.registerHelper('newlineToBr', function(text){
       return new Handlebars.SafeString(text.string.replace(/\n/g, '<br/>'));
   });

  var template =  '<div class="wysiwyg">'+
                    '<div class="btn-toolbar">'+
                      '<div class="btn-group btn-white btn-group-attached btn-group-action active">'+
                        '{{#if bold}}<button type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Bold"><b>B</b></button>{{/if}}'+
                        '{{#if italic}}<button type="button" class="btn btn-small btn-silver" data-tag="italic" rel="tooltip" data-placement="bottom" title="Italic"><i>I</i></button>{{/if}}'+
                        '{{#if underline}}<button type="button" class="btn btn-small btn-silver" data-tag="underline" rel="tooltip" data-placement="bottom" title="Underline"><u>U</u></button>{{/if}}'+
                        '{{#if strikethrough}}<button type="button" class="btn btn-small btn-silver" data-tag="strikethrough" rel="tooltip" data-placement="bottom" title="Strikethrough"><s>S</s></button>{{/if}}'+
                      '</div>'+
                      '<div class="btn-group btn-white btn-group-attached btn-group-action active">'+
                        '{{#if rule}}<button type="button" class="btn btn-small btn-silver" data-tag="inserthorizontalrule" rel="tooltip" data-placement="bottom" title="HR">HR</button>{{/if}}'+
                        '{{#if createlink}}<button type="button" class="btn btn-small btn-silver" data-tag="createlink" rel="tooltip" data-placement="bottom" title="Link">Link</button>'+
                        '<button type="button" class="btn btn-small btn-silver" data-tag="unlink" rel="tooltip" data-placement="bottom" title="Unlink">Unlink</button>{{/if}}'+
                        '{{#if insertimage}}<button type="button" class="btn btn-small btn-silver" data-tag="insertimage" rel="tooltip" data-placement="bottom" title="Image">Image</button>{{/if}}'+
                                          '<button type="button" class="btn btn-small btn-silver" data-tag="insertHTML" rel="tooltip" data-placement="bottom" title="HTML">HTML</button>'+
                                          '<button type="button" class="btn btn-small btn-silver" data-tag="clearHTML" rel="tooltip" data-placement="bottom" title="Remove Formatting">Remove Formatting</button>'+
                      '</div>'+
                    '</div>'+
                    '<div class="input force-editable" style="display:block; height:{{height}}px; overflow:scroll;" contenteditable="true" id="{{name}}">{{newlineToBr value}}</div>'+
                    '<input type="hidden" name="{{name}}" value="{{markupValue}}">'+
                  '</div>';

//<span class="glyphicon-eye-close"></span>

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'focus input': function() { this.$el.find('.label').show(); },
      'keyup input': 'updateMaxLength',
      'blur input': function() { this.$el.find('.label').hide(); },
      'click button' : function(e) {

        var tag = $(e.target).attr('data-tag');
        var value = null;

        if(tag == 'insertHTML'){
          value = prompt("Enter HTML", "");
        }

        if(tag == 'clearHTML') {
          this.removeSelectedFormatting();
        }

        if(tag == 'createlink' || tag == 'insertimage'){
          this.saveSelection();
          value = prompt("Please enter your link", "http://example.com");
          this.restoreSelection();

          if(value === ''){
            return false;
          }
        }

        document.execCommand(tag,false,value);
      },
      'input div.force-editable' : function(e) {
        var innerHtml = $(e.target).html();
        //innerHtml = String(innerHtml).replace(/"/g, '&quot;');
        this.$el.find('input').val(innerHtml);
      },
      'paste' : function(e) {
        if(this.options.settings.get("plaintextpaste") != "on" &&this.options.settings.get("plaintextpaste") != "1") {
          return;
        }

        var active = document.activeElement;
        var sel = window.getSelection();
        var range;
        if(sel.rangeCount) {
          range = sel.getRangeAt(0);
          range.deleteContents();
        }

        var textarea = document.createElement("textarea");
        $(active).append("<textarea id='temparea'></textarea>");
        var $temp = $('#temparea');
        $temp.focus();
        setTimeout(function() {
          var html = $temp.val();
          $temp.remove();
          active.focus();
          console.log(html);
          range.insertNode(document.createTextNode(html));
        }, 1);
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
         //value = value.replace(/[\n]/g, '<br/>');
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
        characters: length - value.length,
        comment: this.options.schema.get('comment')
      };
    },

    saveSelection: function() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                var ranges = [];
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    ranges.push(sel.getRangeAt(i));
                }
                return ranges;
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    },

    restoreSelection: function(savedSel) {
        if (savedSel) {
            if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
                for (var i = 0, len = savedSel.length; i < len; ++i) {
                    sel.addRange(savedSel[i]);
                }
            } else if (document.selection && savedSel.select) {
                savedSel.select();
            }
        }
    },

    initialize: function() {
      //
    },

    removeSelectedFormatting: function() {
      var html = "";
      var sel = window.getSelection();
      var container;

      if(sel.isCollapsed) {
        html = $(document.getElementById(this.options.name)).html().replace(/<(?!br\s*\/?)[^>]+>/g, '');
        this.$el.find('div.force-editable').html(html);
        this.$el.find('input').val(html);
        return;
      }

      if(sel.anchorNode.parentNode != document.getElementById(this.options.name)) {
        html = sel.anchorNode.parentNode.innerHTML.replace(/<(?!br\s*\/?)[^>]+>/g, '');
        container = document.createElement("span");
        container.innerHTML = html;
        sel.anchorNode.parentNode.parentNode.insertBefore(container, sel.anchorNode.parentNode);
        sel.anchorNode.parentNode.remove();
      } else {
        if (sel.rangeCount) {
            container = document.createElement("span");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }

        html = html.replace(/<(?!br\s*\/?)[^>]+>/g, '');

        var range = sel.getRangeAt(0);

        range.deleteContents();

        var div = document.createElement("span");
        div.innerHTML = html;
        var frag = document.createDocumentFragment(), child;
        while ( (child = div.firstChild) ) {
          frag.appendChild(child);
        }

        range.insertNode(frag);
      }

      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }

      this.$el.find('input').val($('div.force-editable').html());
    }
  });

  Module.validate = function(value) {

  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?!br\s*\/?)[^>]+>/g, '').substr(0,100) : '';
  };

  return Module;

});