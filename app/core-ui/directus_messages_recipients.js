//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIView'], function(app, UIView) {

  'use strict';

  var Module = {};

  Module.id = 'directus_messages_recipients';

  Module.dataTypes = [];
  Module.variables = [];

  var template = '<input type="text" id="directus_messages_recipients-input" placeholder="Type users or groups here...">\
                 <div style="width:100%;max-width:700px;" id="directus_messages_recipients-recipients">{{#tags}}<span class="label tag recipient-tag">{{this}}</span>{{/tags}}</div>\
                 <input type="hidden" name="{{name}}" id="directus_messages_recipients-form">';

  Module.Input = UIView.extend({
    template: Handlebars.compile(template),

    events: {
      'click .message-recipient': function(e) {
        var targetId = $(e.target).closest('.message-recipient').data('id');
        delete this.recipients[targetId];

        if(this.deletedDatums[targetId]) {
          this.datums.push(this.deletedDatums[targetId]);
          delete this.deletedDatums[targetId];
        }

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

      this.$('#directus_messages_recipients-input').val("");

      _.each(this.recipients, function(item) {
        var fontWeight = item.type === 1 ? 'font-weight:bold;' : '';
        elArray.push('<div class="message-recipient" data-id="'+item.id+'" style="' + fontWeight + '"><img src="' + item.avatar + '"><div class="recipient-name">' + item.name + '</div></div>');
      });

      this.$el.find('#directus_messages_recipients-form').val(_.keys(this.recipients));
      $el.html(elArray.join(''));
    },

    afterRender: function() {
      var DIRECTUS_USERS = 0;
      var DIRECTUS_GROUPS = 1;
      var me = this;

      var users = app.users.filter(function(item) {
        if(item.get('id') == app.authenticatedUserId.id) {
          return false;
        }
        return true;
      });

      users = users.map(function(item) {
        return {
          id: item.id,
          uid: DIRECTUS_USERS + '_' + item.id,
          name: item.get('first_name') + ' ' + item.get('last_name'),
          avatar: item.getAvatar(),
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
      this.deletedDatums = [];

      _.each(usersAndGroups, function(item) {
        var uid = item.uid;

        datums.push({
          id: uid,
          name: item.name,
          avatar: item.avatar,
          tokens: item.name.split(" ")
        });

        keywordsMap[uid] = item;
        keywords.push(uid+': '+item.name);
       });

      this.datums = datums;

      var engine = new Bloodhound({
        name: 'recipients',
        local: datums,
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
      });

      this.searchEngine = engine;
      engine.initialize();

      this.$("#directus_messages_recipients-input").typeahead({
        limit: 5,
        template: Handlebars.compile('<div><img src="{{avatar}}" class="avatar"><span class="recipient-name">{{name}}</span></div>')
      }, {
        displayKey: 'name',
        source: engine.ttAdapter()
      });

      this.$('#directus_messages_recipients-input').on('typeahead:selected', function (object, datum) {
        me.recipients[datum.id] = datum;
        me.datums = _.filter(me.datums, function(item) {
          if(item == datum) {
            me.deletedDatums[item.id] = item;
            return false;
          }
          return true;
        });
        me.searchEngine.clear();
        me.searchEngine.add(me.datums);
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
