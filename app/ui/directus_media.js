//  Media Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'directus_media';
  Module.system = true;

  var template = '{{#unless isNew}}' +
                 '<fieldset>'+
                 '<div style="margin-right:10px;float:left;height:50px;width:50px;margin-bottom:30px "><img src="{{url}}thumbnail/{{name}}"></div>'+
                 '<div style="line-height:20px"><strong><a href="{{url}}/{{name}}" target="_blank">{{name}}</a><br>Uploaded by <a href="#users/{{user}}">{{userName}}</a> {{{contextualDate date_uploaded}}}</strong><br> <em>{{width}} x {{height}} - {{{bytesToSize size}}}</em><br></div>' +
                 '<ul class="media-actions"><li class="purple inactive"><span class="glyphicon-crop"></span>Crop</li><li class="blue inactive"><span class="glyphicon-repeat"></span>Rotate</li><li class="green" data-action="swap"><span class="glyphicon-random"></span>Swap</li><li class="red"><span class="glyphicon-remove"></span>Delete</li></ul>' +
                 '</fieldset>' +
                 '{{/unless}}' +
                 '<fieldset {{#unless isNew}}class="hide"{{/unless}} id="swap-file">' +
                 '<label>File</label>' +
                 '<div id="upload_file" class="upload-form"><input type="file" name="file" class="large"><p><a href="#" data-action="toggle-form">Use a URL instead</a></p></div>' +
                 '<div id="upload_url" class="upload-form hide"><input type="text" name="file" class="large"><p><a href="#" data-action="toggle-form">Upload a file from the computer</a></p></div>' +
                 '</fieldset>' +
                 '{{#if youtube}}<fieldset><iframe width="720" height="400" src="http://www.youtube.com/embed/pkWWWKKA8jY" frameborder="0" allowfullscreen></iframe></fieldset>{{/if}}';


  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    serialize: function() {
      var data = {};
      var userId;

      if (this.model.isNew()) {
        userId = 1;
        data.isNew = true;
      } else {
        userId = this.model.get('user');
        data = this.model.toJSON();
        if (this.model.get('type') === 'embed/youtube') data.youtube = this.model.get('embed_id');
      }

      data.userName = app.entries.directus_users.get(userId).get('first_name');
      data.url = app.RESOURCES_URL;

      console.log(data);

      return data;
    },

    tagName: 'div',

    events: {
      'click a[data-action=toggle-form]': function() {
        $('.upload-form').toggleClass('hide');
      },
      'click li[data-action=swap]': function() {
        this.$el.find('#swap-file').toggleClass('hide');
      }
    },

    initialize: function() {
      this.$el.html('HEX');

    }
  });

  Module.list = function(options) {

      //The file is not uploaded yet...
      if (options.model.isNew()) {
        return '...';
      }

      var orientation = (parseInt(options.model.get('width'),10) > parseInt(options.model.get('height'),10)) ? 'landscape' : 'portrait';
      var img = '<div class="media-thumb"><img src="' + app.RESOURCES_URL + 'thumbnail/' + options.model.get('name') +'" class="img ' + orientation + '"></div>';
      return img;
  };

  return Module;
});