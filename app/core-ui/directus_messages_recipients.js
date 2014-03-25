//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'directus_messages_recipients';

  Module.dataTypes = [];
  Module.variables = [];

  var template =
                '<style type="text/css">\
                #edit_field_{{name}} .twitter-typeahead {\
                  width:100%;\
                }\
                #edit_field_{{name}} .tt-dropdown-menu { \
                  padding: 3px 0; \
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); \
                  -webkit-border-radius: 2px; \
                  -moz-border-radius: 2px; \
                  border-radius: 2px; \
                  background-color: #fff; \
                } \
                #edit_field_{{name}} .tt-suggestions { \
                    margin-right: 0 !important; \
                } \
                \
                #edit_field_{{name}} .tt-suggestion { \
                    display: block; \
                    padding: 3px 20px; \
                    clear: both; \
                    font-weight: normal; \
                    white-space: nowrap; \
                    font-size: 12px; \
                    margin-right: 0 !important; \
                } \
                \
                #edit_field_{{name}} .tt-is-under-cursor { \
                    color: white; \
                    background-color: black; \
                }\
                </style>\
                 <input type="text" id="directus_messages_recipients-input">\
                 <div style="width:84%; margin-top:5px" id="directus_messages_recipients-recipients">{{#tags}}<span class="label tag recipient-tag">{{this}}</span>{{/tags}}</div>\
                 <input type="hidden" name="{{name}}" id="directus_messages_recipients-form">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'click .recipient-tag': function(e) {
        var targetId = $(e.target).data('id');
        delete this.recipients[targetId];
        this.renderTags();
      }
    },

    recipients: {},

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        tags: []
      };
    },

    renderTags: function() {
      var $el = this.$el.find('#directus_messages_recipients-recipients');
      var elArray = [];

      _.each(this.recipients, function(item) {
        var fontWeight = item.type === 1 ? 'font-weight:bold;' : '';
        elArray.push('<div style="padding:4px; line-height:0px; overflow: auto; display:inline-block; border-radius: 2px; background-color:#EEE; border:1px solid #CCC; margin-right:5px; margin-bottom:5px;' + fontWeight + '"><img src="' + item.avatar + '" style="width:20px; height:20px; margin-right:4px">' + item.name + '<span class="glyphicon-remove recipient-tag" data-id="'+item.id+'" style="display:inline-block; padding:0; line-height:3px; cursor:pointer; margin-left:5px"></span></div>');
      });

      this.$el.find('#directus_messages_recipients-form').val(_.keys(this.recipients));
      $el.html(elArray.join(''));
    },

    afterRender: function() {
      var DIRECTUS_USERS = 0;
      var DIRECTUS_GROUPS = 1;
      var me = this;

      var users = app.users.map(function(item) {
        return {
          id: item.id,
          uid: DIRECTUS_USERS + '_' + item.id,
          name: item.get('first_name') + ' ' + item.get('last_name'),
          avatar: item.get('avatar'),
          type: DIRECTUS_USERS
        };
      });

      var groups = app.groups.map(function(item) {
        return {
          id: item.id,
          uid: DIRECTUS_GROUPS + '_' + item.id,
          name: item.get('name'),
          avatar: app.PATH + 'assets/img/directus-group-avatar-100x100.jpg',
          type: DIRECTUS_GROUPS
        };
      });

      var usersAndGroups = users.concat(groups);
      var keywordsMap = {};
      var keywords = [];
      var datums = [];

       _.each(usersAndGroups, function(item) {
        var uid = item.uid;

        datums.push({
          id: uid,
          value: name,
          name: item.name,
          avatar: item.avatar,
          tokens: item.name.split()
        });

        keywordsMap[uid] = item;
        keywords.push(uid+': '+item.name);
       });


      this.$("#directus_messages_recipients-input").typeahead({

        limit: 5,

        local: datums,

        template: Handlebars.compile('<div><img src="{{avatar}}" class="avatar">{{name}}</div>'),
/*
        highlighter: function (item) {
          var id = item.split(':')[0];
          var obj = keywordsMap[id];
          return '<img src="' +obj.avatar + '" class="avatar">' + obj.name;//'<img src="' + item;
        },

        updater: function(item) {
          var id = item.split(':')[0];
          me.recipients[id] = keywordsMap[id];
          me.renderTags();
        }*/
      });

      this.$('#directus_messages_recipients-input').on('typeahead:selected', function (object, datum) {
        me.recipients[datum.id] = datum;
        me.renderTags();
      });

    },

    initialize: function() {
      this.recipients = {};
    }
  });

  Module.validate = function(value, options) {};

  Module.list = function(options) {
    return '';
  };

  return Module;

});