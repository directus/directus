//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'directus_messages_recepients';

  Module.variables = [];

  var template = '<label>{{capitalize name}} <span class="note">{{comment}}</span></label> \
                 <input type="text" id="directus_messages_recepients-input">\
                 <div style="width:84%; margin-top:5px" id="directus_messages_recepients-recepients">{{#tags}}<span class="label tag">{{this}}</span>{{/tags}}</div>\
                 <input type="hidden" name="{{name}}" id="directus_messages_recepients-form">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {},

    recepients: {},

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        tags: []
      };
    },

    renderTags: function() {
      $el = this.$el.find('#directus_messages_recepients-recepients');
      var elArray = [];

      _.each(this.recepients, function(item) {
        var fontWeight = item.type === 1 ? 'font-weight:bold;' : '';
        elArray.push('<div style="padding:4px; line-height:0px; overflow: auto; display:inline-block; border-radius: 2px; background-color:#EEE; border:1px solid #CCC; margin-right:5px; margin-bottom:5px;' + fontWeight + '"><img src="' + item.avatar + '" style="width:20px; height:20px; margin-right:4px">' + item.name + '<span class="glyphicon-remove" style="display:inline-block; padding:0; line-height:3px; margin-left:5px"></span></div>');
      });

      this.$el.find('#directus_messages_recepients-form').val(_.keys(this.recepients));
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

       _.each(usersAndGroups, function(item) {
        var uid = item.uid;
        keywordsMap[uid] = item;
        keywords.push(uid+': '+item.name);
       });

      this.$("#directus_messages_recepients-input").typeahead({

        minLength: 2,

        items: 5,

        source: function (typeahead, query) {
          typeahead.process(keywords);
        },

        highlighter: function (item) {
          var id = item.split(':')[0];
          var obj = keywordsMap[id];
          return '<img src="' +obj.avatar + '" class="avatar">' + obj.name;//'<img src="' + item;
        },

        updater: function(item) {
          var id = item.split(':')[0];
          me.recepients[id] = keywordsMap[id];
          me.renderTags();
        }
      });
    }
  });

  Module.validate = function(value, options) {};

  Module.list = function(options) {
    return '';
  };

  return Module;

});