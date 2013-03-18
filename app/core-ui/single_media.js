//  Single Media core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name


define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'single_media';
  Module.dataTypes = ['VARCHAR', 'INT'];

  Module.variables = [
    {id: 'allowed_filetypes', ui: 'textinput', char_length:200}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{comment}}</span></label> \
                  <style type="text/css"> \
                  div.ui-thumbnail { \
                    margin-bottom: 10px; \
                    width: 100px; \
                    padding: 10px; \
                    background-color: #ffffff; \
                    border: 1px solid #ededed; \
                    -webkit-border-radius:3px; \
                    -moz-border-radius:3px; \
                    border-radius:3px; \
                    color: #ededed; \
                    text-align: center; \
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
                  div.ui-thumbnail.empty:hover { \
                    background-color: #fefefe; \
                    border: 2px dashed #cccccc; \
                    cursor: pointer; \
                  } \
                  div.ui-thumbnail img { \
                    max-width: 100px; \
                  } \
                  </style> \
                  <!-- <div class="ui-thumbnail"> \
                    <img src="http://images4.fanpop.com/image/photos/16200000/Kitten-pic-cute-kittens-16292210-1024-768.jpg"> \
                  </div> --> \
                  <div class="ui-thumbnail empty">Drag media here</div> \
                  <div class="btn-row"> \
                    <button class="btn btn-small btn-primary" data-action="add" type="button">Swap media</button> \
                    <button class="btn btn-small btn-primary" data-action="remove" type="button">Remove media</button> \
                  </div> \
                  <input type="hidden" value="{{value}}" name="{{name}}" id="{{name}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'change .slider': function(e) {
        var value = e.target.value;
        this.$el.find('span.slider-value').html(value);
      }
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var value = this.options.value || '';

      return {
        value: value,
        name: this.options.name,
        allowed_filetypes: (this.options.settings && this.options.settings.has('allowed_filetypes')) ? this.options.settings.get('allowed_filetypes') : '0',
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function() {
      //
    }

  });

  Module.validate = function(value) {
    //
  };

  Module.list = function(options) {
    return options.value;
  };

  return Module;

});