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
    {id: 'h1', ui: 'checkbox', def: '1'},
    {id: 'h2', ui: 'checkbox', def: '1'},
    {id: 'h3', ui: 'checkbox', def: '1'},
    {id: 'h4', ui: 'checkbox', def: '1'},
    {id: 'h5', ui: 'checkbox', def: '1'},
    {id: 'h6', ui: 'checkbox', def: '1'},
    {id: 'blockquote', ui: 'checkbox', def: '1'},
    {id: 'ul', ui: 'checkbox', def: '1'},
    {id: 'ol', ui: 'checkbox', def: '1'}
  ];

   Handlebars.registerHelper('newlineToBr', function(text){
       return new Handlebars.SafeString(text.string.replace(/\n/g, '<br/>'));
   });

var template = '<div id="wysihtml5-toolbar-{{name}}" class="btn-toolbar" style="display: none;"> \
                  <div class="btn-group btn-white btn-group-attached btn-group-action active"> \
                    {{#if bold}}<button data-wysihtml5-command="bold" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Bold"><b>B</b></button>{{/if}} \
                    {{#if italic}}<button data-wysihtml5-command="italic" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Italic"><i>I</i></button>{{/if}} \
                    {{#if underline}}<button data-wysihtml5-command="underline" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Underline"><u>U</u></button>{{/if}} \
                    {{#if strikethrough}}<button data-wysihtml5-command="strikethrough" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Strikethrough"><s>S</s></button>{{/if}} \
                  </div> \
                  <div class="btn-group btn-white btn-group-attached btn-group-action active"> \
                    {{#if h1}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h1" type="button" class="btn btn-small btn-silver" data-tag="H1" rel="tooltip" data-placement="bottom" title="H1">H1</button>{{/if}} \
                    {{#if h2}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h2" type="button" class="btn btn-small btn-silver" data-tag="H2" rel="tooltip" data-placement="bottom" title="H2">H2</button>{{/if}} \
                    {{#if h3}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h3" type="button" class="btn btn-small btn-silver" data-tag="H3" rel="tooltip" data-placement="bottom" title="H3">H3</button>{{/if}} \
                    {{#if h4}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h4" type="button" class="btn btn-small btn-silver" data-tag="H4" rel="tooltip" data-placement="bottom" title="H4">H4</button>{{/if}} \
                    {{#if h5}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h5" type="button" class="btn btn-small btn-silver" data-tag="H5" rel="tooltip" data-placement="bottom" title="H5">H5</button>{{/if}} \
                    {{#if h6}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h6" type="button" class="btn btn-small btn-silver" data-tag="H6" rel="tooltip" data-placement="bottom" title="H6">H6</button>{{/if}} \
                    {{#if blockquote}}<button data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="blockquote" type="button" class="btn btn-small btn-silver" data-tag="Quote" rel="tooltip" data-placement="bottom" title="Quote">Quote</button>{{/if}} \
                  </div> \
                  <div class="btn-group btn-white btn-group-attached btn-group-action active"> \
                    {{#if ul}}<button data-wysihtml5-command="insertUnorderedList" type="button" class="btn btn-small btn-silver" data-tag="UL" rel="tooltip" data-placement="bottom" title="UL">UL</button>{{/if}} \
                    {{#if ol}}<button data-wysihtml5-command="insertOrderedList" type="button" class="btn btn-small btn-silver" data-tag="OL" rel="tooltip" data-placement="bottom" title="OL">OL</button>{{/if}} \
                  </div> \
                  <div class="btn-group btn-white btn-group-attached btn-group-action active"> \
                    {{#if rule}} \
                      <button data-wysihtml5-command="insertHTML" data-wysihtml5-command-value="<hr>" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Insert Rule">HR</button> \
                    {{/if}} \
                    {{#if createlink}} \
                    <button data-wysihtml5-command="createLink" data-wysihtml5-command-value="http://www.google.com" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Create Link">LINK</button> \
                    {{/if}} \
                    {{#if insertimage}} \
                      <button data-wysihtml5-command="insertImage" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Insert Image">IMAGE</button> \
                    {{/if}} \
                  </div> \
                </div> \
                <textarea id="wysihtml5-textarea-{{name}}" style="height:{{height}}px" placeholder="Enter your text ..." value="{{markupValue}} autofocus></textarea> \
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
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '500',
        bold: (this.options.settings && this.options.settings.has('bold')) ? this.options.settings.get('bold') : true,
        italic: (this.options.settings && this.options.settings.has('italic')) ? this.options.settings.get('italic') : true,
        underline: (this.options.settings && this.options.settings.has('underline')) ? this.options.settings.get('underline') : true,
        strikethrough: (this.options.settings && this.options.settings.has('strikethrough')) ? this.options.settings.get('strikethrough') : true,
        rule: (this.options.settings && this.options.settings.has('rule')) ? this.options.settings.get('rule') : true,
        h1: (this.options.settings && this.options.settings.has('h1')) ? this.options.settings.get('h1') : true,
        h2: (this.options.settings && this.options.settings.has('h2')) ? this.options.settings.get('h2') : true,
        h3: (this.options.settings && this.options.settings.has('h3')) ? this.options.settings.get('h3') : true,
        h4: (this.options.settings && this.options.settings.has('h4')) ? this.options.settings.get('h4') : true,
        h5: (this.options.settings && this.options.settings.has('h5')) ? this.options.settings.get('h5') : true,
        h6: (this.options.settings && this.options.settings.has('h6')) ? this.options.settings.get('h6') : true,
        blockquote: (this.options.settings && this.options.settings.has('blockquote')) ? this.options.settings.get('blockquote') : true,
        ul: (this.options.settings && this.options.settings.has('ul')) ? this.options.settings.get('ul') : true,
        ol: (this.options.settings && this.options.settings.has('ol')) ? this.options.settings.get('ol') : true,
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
      var that = this;

      $.ajax({
        url: "//cdn.jsdelivr.net/wysihtml5/0.3.0/wysihtml5-0.3.0.min.js",
        dataType: "script",
        success: function() {
          that.initEditor();
        }
      });
    },

    initEditor: function() {
      var that = this;
      this.editor = new wysihtml5.Editor("wysihtml5-textarea-" + this.options.name, { // id of textarea element
        toolbar:      "wysihtml5-toolbar-" + this.options.name, // id of toolbar element
        stylesheets: app.PATH + "assets/css/wysiwyg.css",
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




var wysihtml5ParserRules = {
    /**
     * CSS Class white-list
     * Following CSS classes won't be removed when parsed by the wysihtml5 HTML parser
     */
    "classes": {
        "wysiwyg-clear-both": 1,
        "wysiwyg-clear-left": 1,
        "wysiwyg-clear-right": 1,
        "wysiwyg-color-aqua": 1,
        "wysiwyg-color-black": 1,
        "wysiwyg-color-blue": 1,
        "wysiwyg-color-fuchsia": 1,
        "wysiwyg-color-gray": 1,
        "wysiwyg-color-green": 1,
        "wysiwyg-color-lime": 1,
        "wysiwyg-color-maroon": 1,
        "wysiwyg-color-navy": 1,
        "wysiwyg-color-olive": 1,
        "wysiwyg-color-purple": 1,
        "wysiwyg-color-red": 1,
        "wysiwyg-color-silver": 1,
        "wysiwyg-color-teal": 1,
        "wysiwyg-color-white": 1,
        "wysiwyg-color-yellow": 1,
        "wysiwyg-float-left": 1,
        "wysiwyg-float-right": 1,
        "wysiwyg-font-size-large": 1,
        "wysiwyg-font-size-larger": 1,
        "wysiwyg-font-size-medium": 1,
        "wysiwyg-font-size-small": 1,
        "wysiwyg-font-size-smaller": 1,
        "wysiwyg-font-size-x-large": 1,
        "wysiwyg-font-size-x-small": 1,
        "wysiwyg-font-size-xx-large": 1,
        "wysiwyg-font-size-xx-small": 1,
        "wysiwyg-text-align-center": 1,
        "wysiwyg-text-align-justify": 1,
        "wysiwyg-text-align-left": 1,
        "wysiwyg-text-align-right": 1
    },
    /**
     * Tag list
     *
     * The following options are available:
     *
     *    - add_class:        converts and deletes the given HTML4 attribute (align, clear, ...) via the given method to a css class
     *                        The following methods are implemented in wysihtml5.dom.parse:
     *                          - align_text:  converts align attribute values (right/left/center/justify) to their corresponding css class "wysiwyg-text-align-*")
     *                            <p align="center">foo</p> ... becomes ... <p> class="wysiwyg-text-align-center">foo</p>
     *                          - clear_br:    converts clear attribute values left/right/all/both to their corresponding css class "wysiwyg-clear-*"
     *                            <br clear="all"> ... becomes ... <br class="wysiwyg-clear-both">
     *                          - align_img:    converts align attribute values (right/left) on <img> to their corresponding css class "wysiwyg-float-*"
     *
     *    - remove:             removes the element and its content
     *
     *    - rename_tag:         renames the element to the given tag
     *
     *    - set_class:          adds the given class to the element (note: make sure that the class is in the "classes" white list above)
     *
     *    - set_attributes:     sets/overrides the given attributes
     *
     *    - check_attributes:   checks the given HTML attribute via the given method
     *                            - url:            allows only valid urls (starting with http:// or https://)
     *                            - src:            allows something like "/foobar.jpg", "http://google.com", ...
     *                            - href:           allows something like "mailto:bert@foo.com", "http://google.com", "/foobar.jpg"
     *                            - alt:            strips unwanted characters. if the attribute is not set, then it gets set (to ensure valid and compatible HTML)
     *                            - numbers:  ensures that the attribute only contains numeric characters
     */
    "tags": {
        "tr": {
            "add_class": {
                "align": "align_text"
            }
        },
        "strike": 1,
        // "strike": {
        //     "remove": 1
        // },
        "form": {
            "rename_tag": "div"
        },
        "rt": {
            "rename_tag": "span"
        },
        "code": {},
        "acronym": {
            "rename_tag": "span"
        },
        "br": {
            "add_class": {
                "clear": "clear_br"
            }
        },
        "details": {
            "rename_tag": "div"
        },
        "h4": {
            "add_class": {
                "align": "align_text"
            }
        },
        "em": {},
        "title": {
            "remove": 1
        },
        "multicol": {
            "rename_tag": "div"
        },
        "figure": {
            "rename_tag": "div"
        },
        "xmp": {
            "rename_tag": "span"
        },
        "small": {
            "rename_tag": "span",
            "set_class": "wysiwyg-font-size-smaller"
        },
        "area": {
            "remove": 1
        },
        "time": {
            "rename_tag": "span"
        },
        "dir": {
            "rename_tag": "ul"
        },
        "bdi": {
            "rename_tag": "span"
        },
        "command": {
            "remove": 1
        },
        "ul": {},
        "progress": {
            "rename_tag": "span"
        },
        "dfn": {
            "rename_tag": "span"
        },
        "iframe": {
            "remove": 1
        },
        "figcaption": {
            "rename_tag": "div"
        },
        "a": {
            "check_attributes": {
                "href": "url" // if you compiled master manually then change this from 'url' to 'href'
            },
            "set_attributes": {
                "rel": "nofollow",
                "target": "_blank"
            }
        },
        "img": {
            "check_attributes": {
                "width": "numbers",
                "alt": "alt",
                "src": "url", // if you compiled master manually then change this from 'url' to 'src'
                "height": "numbers"
            },
            "add_class": {
                "align": "align_img"
            }
        },
        "rb": {
            "rename_tag": "span"
        },
        "footer": {
            "rename_tag": "div"
        },
        "noframes": {
            "remove": 1
        },
        "abbr": {
            "rename_tag": "span"
        },
        "u": 1,
        "bgsound": {
            "remove": 1
        },
        "sup": {
            "rename_tag": "span"
        },
        "address": {
            "rename_tag": "div"
        },
        "basefont": {
            "remove": 1
        },
        "nav": {
            "rename_tag": "div"
        },
        "h1": {
            "add_class": {
                "align": "align_text"
            }
        },
        "head": {
            "remove": 1
        },
        "tbody": {
            "add_class": {
                "align": "align_text"
            }
        },
        "dd": {
            "rename_tag": "div"
        },
        "s": 1,
        // "s": {
        //     "rename_tag": "span"
        // },
        "li": {},
        "td": {
            "check_attributes": {
                "rowspan": "numbers",
                "colspan": "numbers"
            },
            "add_class": {
                "align": "align_text"
            }
        },
        "object": {
            "remove": 1
        },
        "div": {
            "add_class": {
                "align": "align_text"
            }
        },
        "option": {
            "rename_tag": "span"
        },
        "select": {
            "rename_tag": "span"
        },
        "i": {},
        "track": {
            "remove": 1
        },
        "wbr": {
            "remove": 1
        },
        "fieldset": {
            "rename_tag": "div"
        },
        "big": {
            "rename_tag": "span",
            "set_class": "wysiwyg-font-size-larger"
        },
        "button": {
            "rename_tag": "span"
        },
        "noscript": {
            "remove": 1
        },
        "svg": {
            "remove": 1
        },
        "input": {
            "remove": 1
        },
        "table": {},
        "keygen": {
            "remove": 1
        },
        "h5": {
            "add_class": {
                "align": "align_text"
            }
        },
        "meta": {
            "remove": 1
        },
        "map": {
            "rename_tag": "div"
        },
        "isindex": {
            "remove": 1
        },
        "mark": {
            "rename_tag": "span"
        },
        "caption": {
            "add_class": {
                "align": "align_text"
            }
        },
        "tfoot": {
            "add_class": {
                "align": "align_text"
            }
        },
        "base": {
            "remove": 1
        },
        "video": {
            "remove": 1
        },
        "strong": {},
        "canvas": {
            "remove": 1
        },
        "output": {
            "rename_tag": "span"
        },
        "marquee": {
            "rename_tag": "span"
        },
        "b": {},
        "q": {
            "check_attributes": {
                "cite": "url"
            }
        },
        "applet": {
            "remove": 1
        },
        "span": {},
        "rp": {
            "rename_tag": "span"
        },
        "spacer": {
            "remove": 1
        },
        "source": {
            "remove": 1
        },
        "aside": {
            "rename_tag": "div"
        },
        "frame": {
            "remove": 1
        },
        "section": {
            "rename_tag": "div"
        },
        "body": {
            "rename_tag": "div"
        },
        "ol": {},
        "nobr": {
            "rename_tag": "span"
        },
        "html": {
            "rename_tag": "div"
        },
        "summary": {
            "rename_tag": "span"
        },
        "var": {
            "rename_tag": "span"
        },
        "del": {
            "remove": 1
        },
        "blockquote": {
            "check_attributes": {
                "cite": "url"
            }
        },
        "style": {
            "remove": 1
        },
        "device": {
            "remove": 1
        },
        "meter": {
            "rename_tag": "span"
        },
        "h3": {
            "add_class": {
                "align": "align_text"
            }
        },
        "textarea": {
            "rename_tag": "span"
        },
        "embed": {
            "remove": 1
        },
        "hgroup": {
            "rename_tag": "div"
        },
        "font": {
            "rename_tag": "span",
            "add_class": {
                "size": "size_font"
            }
        },
        "tt": {
            "rename_tag": "span"
        },
        "noembed": {
            "remove": 1
        },
        "thead": {
            "add_class": {
                "align": "align_text"
            }
        },
        "blink": {
            "rename_tag": "span"
        },
        "plaintext": {
            "rename_tag": "span"
        },
        "xml": {
            "remove": 1
        },
        "h6": {
            "add_class": {
                "align": "align_text"
            }
        },
        "param": {
            "remove": 1
        },
        "th": {
            "check_attributes": {
                "rowspan": "numbers",
                "colspan": "numbers"
            },
            "add_class": {
                "align": "align_text"
            }
        },
        "legend": {
            "rename_tag": "span"
        },
        "hr": {},
        "label": {
            "rename_tag": "span"
        },
        "dl": {
            "rename_tag": "div"
        },
        "kbd": {
            "rename_tag": "span"
        },
        "listing": {
            "rename_tag": "div"
        },
        "dt": {
            "rename_tag": "span"
        },
        "nextid": {
            "remove": 1
        },
        "pre": {},
        "center": {
            "rename_tag": "div",
            "set_class": "wysiwyg-text-align-center"
        },
        "audio": {
            "remove": 1
        },
        "datalist": {
            "rename_tag": "span"
        },
        "samp": {
            "rename_tag": "span"
        },
        "col": {
            "remove": 1
        },
        "article": {
            "rename_tag": "div"
        },
        "cite": {},
        "link": {
            "remove": 1
        },
        "script": {
            "remove": 1
        },
        "bdo": {
            "rename_tag": "span"
        },
        "menu": {
            "rename_tag": "ul"
        },
        "colgroup": {
            "remove": 1
        },
        "ruby": {
            "rename_tag": "span"
        },
        "h2": {
            "add_class": {
                "align": "align_text"
            }
        },
        "ins": {
            "rename_tag": "span"
        },
        "p": {
            "add_class": {
                "align": "align_text"
            }
        },
        "sub": {
            "rename_tag": "span"
        },
        "comment": {
            "remove": 1
        },
        "frameset": {
            "remove": 1
        },
        "optgroup": {
            "rename_tag": "span"
        },
        "header": {
            "rename_tag": "div"
        }
    }
};