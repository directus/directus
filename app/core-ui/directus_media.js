//  Media Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'directus_media';
  Module.system = true;

    var template = '{{#if url}} \
                    <fieldset class="media-modal"> \
                      <div style="margin-right:10px;float:left;height:auto;width:50px;"> \
                        <a href="{{url}}" target="_blank"> \
                          {{#if isPDF }} \
                          <em>PDF Icon Here</em> \
                          {{else}} \
                          <img class="{{orientation}}" src="{{thumbUrl}}" /> \
                          {{/if}} \
                        </a> \
                      </div> \
                      <div style="line-height:20px"> \
                        <strong> \
                        <a href="{{url}}" target="_blank">{{name}}</a><br> \
                        Uploaded by <a href="#users/{{user}}">{{userFirstName}}</a> {{{contextualDate date_uploaded}}} \
                        </strong><br> \
                      <em>{{#unless isPDF}}{{width}} x {{height}} - {{/unless}}{{{bytesToSize size}}}</em><br> \
                      </div> \
                      <ul class="media-actions"> \
                        {{#unless isPDF }} \
                        <li class="purple"><span class="glyphicon-crop"></span>Crop</li> \
                        <li class="blue"><span class="glyphicon-repeat"></span>Rotate</li> \
                        {{/unless}} \
                        <li class="green" data-action="swap"><span class="glyphicon-random"></span>Swap</li> \
                        <li class="red"><span class="glyphicon-remove"></span>Delete</li> \
                      </ul> \
                    </fieldset> \
                    {{/if}} \
                    <fieldset {{#if url}}class="hide"{{/if}} id="swap-file"> \
                      <label>File</label> \
                      <div id="upload_file" class="upload-form"><input type="file" class="large" /> \
                      <p><a href="#" data-action="toggle-form">Use a URL instead</a></p></div> \
                      <div id="upload_url" class="upload-form hide"> \
                      <input type="text" class="large" name="url" /> \
                      <p><a href="#" data-action="toggle-form">Upload a file from the computer</a></p></div> \
                    </fieldset> \
                    {{#if youtube}}<fieldset><iframe width="720" height="400" src="http://www.youtube.com/embed/pkWWWKKA8jY" frameborder="0" allowfullscreen></iframe></fieldset>{{/if}}';

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    serialize: function() {

      var data = {},
          userId,
          model = this.model,
          authenticatedUser = app.getCurrentUser();

      data = model.toJSON();
      if (!model.has('id')) {
        userId = authenticatedUser.id;
        data.isNew = true;
      } else {
        userId = model.get('user');
        if (model.get('type') === 'embed/youtube') {
          data.youtube = model.get('embed_id');
        }
      }

      var user = app.users.get(userId);

      data.isPDF = ("application/pdf" == model.get('type'));
      data.userFirstName = user ? user.get('first_name') : "Unknown User";
      data.url = undefined;
      data.thumbUrl = undefined;

      var storageAdapter = model.get('storage_adapter');

      if(storageAdapter !== null &&
         storageAdapter !== undefined &&
         storageAdapter !== '') {
          data.url = app.makeMediaUrl(model, false);
          data.thumbUrl = app.makeMediaUrl(model, true);
      }

      data.name = model.get('name');
      data.orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';

      return data;
    },

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {
      'click a[data-action=toggle-form]': function() {
        $('.upload-form').toggleClass('hide');
      },
      'click li[data-action=swap]': function() {
        this.$el.find('#swap-file').toggleClass('hide');
      },
      'change input[type=file]': function(e) {
        var file = $(e.target)[0].files[0];
        var model = this.model;
        app.sendFiles(file, function(data) {
          model.set(data[0]);
        });
      }
    },

    initialize: function() {
      this.model.on('change', this.render, this);
    }
  });

  Module.list = function(options) {
    var model = options.model;
    var orientation = (parseInt(model.get('width'),10) > parseInt(model.get('height'),10)) ? 'landscape' : 'portrait';
    var url = app.makeMediaUrl(model, true);
    var isImage = _.contains(['image/jpeg','image/png'], model.get('type'));
    var thumbUrl = isImage ? url : app.PATH + 'assets/img/document-100x120.png';

    var img = '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    return img;
  };

  return Module;
});