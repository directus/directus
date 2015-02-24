//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'core/overlays/overlays'], function(app, Backbone, Overlays) {

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
    {id: 'strikethrough', ui: 'checkbox', def: '0'},
    {id: 'rule', ui: 'checkbox', def: '0'},
    {id: 'createlink', ui: 'checkbox', def: '0'},
    {id: 'insertimage', ui: 'checkbox', def: '0'},
    {id: 'embedVideo', ui: 'checkbox', def: '0'},
    {id: 'embed_width', ui: 'numeric', def: 300},
    {id: 'embed_height', ui: 'numeric', def: 200},
    {id: 'html', ui: 'checkbox', def: '0'},
    {id: 'orderedList', ui: 'checkbox', def: '0'},
    {id: 'h1', ui: 'checkbox', def: '0'},
    {id: 'h2', ui: 'checkbox', def: '0'},
    {id: 'h3', ui: 'checkbox', def: '0'},
    {id: 'h4', ui: 'checkbox', def: '0'},
    {id: 'h5', ui: 'checkbox', def: '0'},
    {id: 'h6', ui: 'checkbox', def: '0'},
    {id: 'blockquote', ui: 'checkbox', def: '0'},
    {id: 'ul', ui: 'checkbox', def: '0'},
    {id: 'ol', ui: 'checkbox', def: '0'}
  ];

   Handlebars.registerHelper('newlineToBr', function(text){
       return new Handlebars.SafeString(text.string.replace(/\n/g, '<br/>'));
   });

var template = '<style type="text/css"> \
                  div.ui-thumbnail { \
                    float: left; \
                    margin-top: 8px; \
                    max-height: 200px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #ededed; \
                    -webkit-border-radius:3px; \
                    -moz-border-radius:3px; \
                    border-radius:3px; \
                    color: #ededed; \
                    text-align: center; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail.empty { \
                    width: 300px; \
                    height: 100px; \
                    background-color: #ffffff; \
                    border: 2px dashed #ededed; \
                    padding: 9px; \
                    font-size: 16px; \
                    font-weight: 600; \
                    line-height: 100px; \
                  } \
                  div.ui-thumbnail.empty.dragover, \
                  div.ui-thumbnail.empty:hover { \
                    background-color: #fefefe; \
                    border: 2px dashed #cccccc; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail img { \
                    max-height: 200px; \
                  } \
                  .wysihtml5-textarea-body iframe { \
                    width: 100%; \
                  } \
                  </style> \
                  <div id="wysihtml5-toolbar-{{name}}" class="btn-toolbar" style="display: none;"> \
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
                    {{#if orderedList}}<button data-wysihtml5-command="insertOrderedList" type="button" class="btn btn-small btn-silver" data-tag="List" rel="tooltip" data-placement="bottom" title="List">List</button>{{/if}} \
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
                    <button data-wysihtml5-command="createLink" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Create Link">Link</button> \
                    <div data-wysihtml5-dialog="createLink" style="display: none;z-index:108" class="directus-alert-modal"> \
                      <div class="directus-alert-modal-message">Please Insert a Link</div> \
                      <input type="text" data-wysihtml5-dialog-field="href" value="http://"> \
                      <div class="directus-alert-modal-buttons"> \
                        <button data-wysihtml5-dialog-action="cancel" type="button">Cancel</button> \
                        <button data-wysihtml5-dialog-action="save" type="button" class="primary">OK</button> \
                      </div> \
                    </div> \
                    {{/if}} \
                    {{#if insertimage}} \
                      <button data-wysihtml5-command="insertImage" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Insert Image">Image</button> \
                      <div data-wysihtml5-dialog="insertImage" style="display: none;z-index:108" class="directus-alert-modal"> \
                        <div><button id="existingFileButton" type="button" class="btn" style="float:none;margin-bottom:10px;background-color: #F4F4F4;font-weight:600;width:100%;border: none;">Choose Existing File</button></div> \
                        <div style="position:relative;margin-bottom:10px;width:100%;background-color:#F4F4F4;text-align:center;font-weight:600;padding-top:10px;padding-bottom:10px;">Choose From Computer<input id="fileAddInput" type="file" class="large" style="position:absolute;top:0;left:0;cursor:pointer;opacity:0.0;width:100%;height:100%;z-index:9;" /></div> \
                        <div><input type="text" data-wysihtml5-dialog-field="src" id="insertImageInput" value="http://" style="font-weight:600;"></div> \
                        <div class="directus-alert-modal-buttons"> \
                          <button data-wysihtml5-dialog-action="cancel" type="button">Cancel</button> \
                          <button data-wysihtml5-dialog-action="save" id="insertImageButton" type="button" class="primary">OK</button> \
                        </div> \
                      </div> \
                    {{/if}} \
                    {{#if embedVideo}} \
                      <button data-wysihtml5-command="embedVideo" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Embed Video">Embed</button> \
                      <div data-wysihtml5-dialog="embedVideo" style="display: none;z-index:108" class="directus-alert-modal"> \
                        <div><button id="existingLinkButton" type="button" class="btn" style="float:none;margin-bottom:10px;background-color: #F4F4F4;font-weight:600;width:100%;border: none;">Choose Existing Link</button></div> \
                        <div><input type="text" class="videoEmbedWidth" id="embedWidthInput" value="{{embed_width}}" style="font-weight:600;"></div><br/> \
                        <div><input type="text" class="videoEmbedHeight" id="embedHeightInput" value="{{embed_height}}" style="font-weight:600;"></div><br/> \
                        <div><input type="text" class="videoEmbedInput" data-type="youtube" id="insertYoutubeEmbedInput" placeholder="Youtube Video ID" style="font-weight:600;"></div><br/> \
                        <div><input type="text" class="videoEmbedInput" data-type="vimeo" id="insertVimeoEmbedInput" placeholder="Vimeo Video ID" style="font-weight:600;"></div> \
                        <div><input type="hidden"  data-wysihtml5-dialog-field="src" id="insertEmbedInput"></div> \
                        <div><input type="hidden"  data-wysihtml5-dialog-field="data-type" id="insertEmbedInputType"></div> \
                        <div class="directus-alert-modal-buttons"> \
                          <button data-wysihtml5-dialog-action="cancel" type="button">Cancel</button> \
                          <button data-wysihtml5-dialog-action="save" id="insertEmbedButton" type="button" class="primary">OK</button> \
                        </div> \
                      </div> \
                    {{/if}} \
                    {{#if html}} \
                      <button data-wysihtml5-action="change_view" type="button" class="btn btn-small btn-silver" data-tag="bold" rel="tooltip" data-placement="bottom" title="Toggle HTML">HTML</button> \
                    {{/if}} \
                  </div> \
                </div> \
                <div style="display:none;z-index:998;position:absolute;width:100%;height:100%;top:-5px;left:-5px;" id="iframe_blocker"></div> \
                <textarea id="wysihtml5-textarea-{{name}}" class="wysihtml5-style" style="height:{{height}}px" placeholder="Enter your text ..." value="{{markupValue}}"></textarea> \
                <input type="hidden" name="{{name}}" class="hidden_input" value="{{{markupValue}}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'input textarea' : 'textChanged',
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var self = this;
        var model = new app.files.model({}, {collection: app.files});
        app.sendFiles(file, function(data) {
          _.each(data, function(item) {
            item[app.statusMapping.status_name] = app.statusMapping.active_num;
            item.id = undefined;
            item.user = self.userId;

            model.save(item, {success: function(e) {
              var url = model.makeFileUrl(false);
              var title = model.attributes.title;
              self.$el.find('#insertImageInput').val(url);
              self.$el.find('input[type=file]').val("");
              self.editor.composer.commands.exec("insertImage", { src: url, alt: title, title: title});
              $('.directus-alert-modal').addClass('hide'); //  manually close modal
            }});
          });
        });
      },
      'click #existingFileButton': function(e) {
        var collection = app.files;
        var model;
        var fileModel = new app.files.model({}, {collection: collection});
        collection.fetch();
        var view = new Overlays.ListSelect({collection: collection, selectable: false});
        app.router.overlayPage(view);
        var self = this;

        view.itemClicked = function(e) {
          var id = $(e.target).closest('tr').attr('data-id');
          model = collection.get(id);
          app.router.removeOverlayPage(this);
          var url = model.makeFileUrl(false);
          var title = model.attributes.title;
          self.editor.composer.commands.exec("insertImage", { src: url, alt: title, title: title});
          $('.directus-alert-modal').addClass('hide'); //  manually close modal
        };
      },
      'click #existingLinkButton': function(e) {
        var collection = app.files;
        var model;
        var fileModel = new app.files.model({}, {collection: collection});
        collection.setFilter('adv_search', [{id:'type',type:'like',value:'embed/'}]);
        collection.fetch();
        var view = new Overlays.ListSelect({collection: collection, selectable: false});
        app.router.overlayPage(view);
        var self = this;

        view.itemClicked = function(e) {
          var id = $(e.target).closest('tr').attr('data-id');
          model = collection.get(id);
          app.router.removeOverlayPage(this);
          if(model.get('type') == "embed/youtube" || model.get('type') == "embed/vimeo" ) {
            var url = model.get('url');

            if(model.get('type') == "embed/vimeo") {
              self.$el.find('#insertEmbedInputType').val('vimeo');
            } else {
              self.$el.find('#insertEmbedInputType').val('youtube');
            }

            self.$el.find('#insertEmbedInput').val(url);
            self.$el.find('#insertEmbedButton').click();
          }
        };
      },
      'change .videoEmbedInput': function(e) {
        var target = $(e.target);

        if(target.val()) {
          this.$el.find('#insertEmbedInput').val(target.val());
          this.$el.find('#insertEmbedInputType').val(target.attr('data-type'));
        }
      }
    },

    textChanged: function(view) {
      if(view.editor){
        try {
          view.$('.hidden_input').val(view.editor.getValue());
        } catch (err){
          console.log(err.message);
        }
      }
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      return {
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '500',
        bold: (this.options.settings && this.options.settings.has('bold')) ? this.options.settings.get('bold')!=='0' : true,
        italic: (this.options.settings && this.options.settings.has('italic')) ? this.options.settings.get('italic')!=='0' : true,
        underline: (this.options.settings && this.options.settings.has('underline')) ? this.options.settings.get('underline')!=='0' : true,
        strikethrough: (this.options.settings && this.options.settings.has('strikethrough')) ? this.options.settings.get('strikethrough')!=='0' : false,
        rule: (this.options.settings && this.options.settings.has('rule')) ? this.options.settings.get('rule')!=='0' : false,
        h1: (this.options.settings && this.options.settings.has('h1')) ? this.options.settings.get('h1')!=='0' : false,
        h2: (this.options.settings && this.options.settings.has('h2')) ? this.options.settings.get('h2')!=='0' : false,
        h3: (this.options.settings && this.options.settings.has('h3')) ? this.options.settings.get('h3')!=='0' : false,
        h4: (this.options.settings && this.options.settings.has('h4')) ? this.options.settings.get('h4')!=='0' : false,
        h5: (this.options.settings && this.options.settings.has('h5')) ? this.options.settings.get('h5')!=='0' : false,
        h6: (this.options.settings && this.options.settings.has('h6')) ? this.options.settings.get('h6')!=='0' : false,
        blockquote: (this.options.settings && this.options.settings.has('blockquote')) ? this.options.settings.get('blockquote')!=='0' : false,
        ul: (this.options.settings && this.options.settings.has('ul')) ? this.options.settings.get('ul')!=='0' : false,
        ol: (this.options.settings && this.options.settings.has('ol')) ? this.options.settings.get('ol')!=='0' : false,
        orderedList: (this.options.settings && this.options.settings.has('orderedList')) ? this.options.settings.get('orderedList')!=='0' : false,
        createlink: (this.options.settings && this.options.settings.has('createlink')) ? this.options.settings.get('createlink')!=='0' : false,
        insertimage: (this.options.settings && this.options.settings.has('insertimage')) ? this.options.settings.get('insertimage')!=='0' : false,
        embedVideo: (this.options.settings && this.options.settings.has('embedVideo')) ? this.options.settings.get('embedVideo')!=='0' : false,
        embed_width: (this.options.settings && this.options.settings.has('embed_width')) ? this.options.settings.get('embed_width') : '300',
        embed_height: (this.options.settings && this.options.settings.has('embed_height')) ? this.options.settings.get('embed_height') : '200',
        html: (this.options.settings && this.options.settings.has('html')) ? this.options.settings.get('html')!=='0' : false,
        markupValue: String(value).replace(/"/g, '&quot;'),
        value: new Handlebars.SafeString(value),
        name: this.options.name,
        maxLength: length,
        characters: length - value.length
      };
    },

    initialize: function() {
      var that = this;
      this.userId = app.users.getCurrentUser().id;

      $.ajax({
        //url: "//cdn.jsdelivr.net/wysihtml5/0.3.0/wysihtml5-0.3.0.min.js",
        url: window.location.origin + window.directusData.path +"assets/js/libs/wysihtml5.js",
        dataType: "script",
        success: function() {
          that.initEditor();
        }
      });
    },

    afterRender: function() {
      if (this.options.settings.get("readonly") === "on") this.editor.readonly();
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

      var timer;
      var $dropzone = this.$el;
      var self = this;
      var model = new app.files.model({}, {collection: app.files});
      $dropzone.on('dragover', function(e) {
        self.$el.find('#iframe_blocker').show();
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave', function(e) {
        clearInterval(timer);
        timer = setInterval(function(){
          self.$el.find('#iframe_blocker').hide();
          $dropzone.removeClass('dragover');
          clearInterval(timer);
        },50);
      });


      $dropzone[0].ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();
        self.$el.find('#iframe_blocker').hide();
        if (e.dataTransfer.files.length > 1) {
          alert('One file only please');
          return;
        }
        this.editor.focus();
        app.sendFiles(e.dataTransfer.files, function(data) {
          _.each(data, function(item) {
            item[app.statusMapping.status_name] = app.statusMapping.status_num;
            item.id = undefined;
            item.user = self.userId;

            model.save(item, {success: function(e) {
              var url = model.makeFileUrl(false);
              try {
                self.editor.composer.commands.exec("insertImage", { src: url, alt: model.get('title'), title: model.get('title')});
              } catch(ex) {}

            }});
          });
        });
        $dropzone.removeClass('dragover');
      }, this);

      this.$el.find('.wysihtml5-sandbox').contents().find('body').on('dragover', function(e) {
        self.$el.find('#iframe_blocker').show();
      });

      wysihtml5.commands.embedVideo = {
        exec: function(composer, command, value) {
          var doc   = composer.doc,
                      image;

          var width = that.$el.find('#embedWidthInput').val();
          var height = that.$el.find('#embedHeightInput').val();

          image = doc.createElement("iframe");
          image.setAttribute('width', width);
          image.setAttribute('height', height);
          image.setAttribute('frameborder', '0');
          image.setAttribute('allowfullscreen', '1');

          var type = "youtube";
          if(value['data-type']) {
            type = value['data-type'];
          }

          for (var i in value) {
            if(i==="src") {
              if(type == 'youtube') {
                value[i] = "http://youtube.com/embed/" + value[i];
              } else {
                value[i] = "//player.vimeo.com/video/" + value[i] + "?title=0&amp;byline=0&amp;portrait=0&amp;color=c9ff23";
              }
            }
            if(i === "data-type") {
              continue;
            }
            image.setAttribute(i === "className" ? "class" : i, value[i]);
          }

          composer.selection.insertNode(image);
          composer.selection.setAfter(image);

          that.textChanged(that);
        },
      };

      wysihtml5.commands.createLink.triggerEvent = function() {
        that.textChanged(that);
      };
    }
  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value)) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/(<([^>]+)>)/ig, '').substr(0,100) : '';
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
         "iframe": {
            "check_attributes": {
                "width": "numbers",
                "src": "url",
                "height": "numbers",
                "frameborder": "numbers"
            },
            "set_attributes": {
              "frameborder": "0",
              "allowfullscreen": ""
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

