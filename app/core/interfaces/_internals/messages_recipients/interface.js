/* global $ _ Bloodhound */
define(['app', 'handlebars', 'core/UIView'], function (app, Handlebars, UIView) {
  return UIView.extend({
    template: '_internals/messages_recipients/input',

    events: {
      'click .js-message-recipient': function (event) {
        var targetId = $(event.currentTarget).data('id');
        delete this.recipients[targetId];

        if (this.deletedDatums[targetId]) {
          this.datums.push(this.deletedDatums[targetId]);
          delete this.deletedDatums[targetId];
        }

        this.searchEngine.clear();
        this.searchEngine.add(this.datums);
        this.renderTags();
      }
    },

    recipients: {},

    serialize: function () {
      return {
        value: this.options.value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        tags: []
      };
    },

    renderTags: function () {
      var $el = this.$('#directus_messages_recipients-recipients.to');
      var elArray = [];

      this.$('#directus_messages_recipients-input').typeahead('val', '');

      _.each(this.recipients, function (item) {
        var icon = item.id[0] === 1 ? '<i class="material-icons">group</i>' : '';

        elArray.push('<span class="js-message-recipient" data-id="' + item.id + '">' + icon + ' ' + item.name + '</span>');
      });

      this.$el.find('#directus_messages_recipients-form').val(_.keys(this.recipients));
      // __t('message_to') + ': ' +
      $el.html(elArray.join(''));
    },

    afterRender: function () {
      var DIRECTUS_USERS = 0;
      var DIRECTUS_GROUPS = 1;
      var me = this;

      var users = app.users.filter(function (item) {
        return item.get('id') !== app.authenticatedUserId.id;
      });

      users = users.map(function (item) {
        return {
          id: item.id,
          uid: DIRECTUS_USERS + '_' + item.id,
          name: item.get('first_name') + ' ' + item.get('last_name'),
          avatar: item.getAvatar(),
          type: DIRECTUS_USERS
        };
      });

      var groups = app.groups.map(function (item) {
        return {
          id: item.id,
          uid: DIRECTUS_GROUPS + '_' + item.id,
          name: item.get('name'),
          avatar: app.PATH + 'assets/imgs/directus-group-avatar.svg',
          type: DIRECTUS_GROUPS
        };
      });

      var usersAndGroups = users.concat(groups);
      var keywordsMap = {};
      var keywords = [];
      var datums = [];
      this.deletedDatums = [];

      _.each(usersAndGroups, function (item) {
        var uid = item.uid;

        datums.push({
          id: uid,
          name: item.name,
          avatar: item.avatar,
          tokens: item.name.split(' ')
        });

        keywordsMap[uid] = item;
        keywords.push(uid + ': ' + item.name);
      });

      this.datums = datums;

      var engine = new Bloodhound({
        name: 'recipients',
        local: datums,
        datumTokenizer: function (d) {
          return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
      });

      this.searchEngine = engine;
      engine.initialize();

      this.$('#directus_messages_recipients-input').typeahead({
        limit: 5,
        template: Handlebars.compile('<div><img src="{{avatar}}" class="avatar"><span class="recipient-name">{{name}}</span></div>')
      }, {
        displayKey: 'name',
        source: engine.ttAdapter()
      });

      this.$('#directus_messages_recipients-input').on('typeahead:selected', function (object, datum) {
        me.recipients[datum.id] = datum;
        me.datums = _.filter(me.datums, function (item) {
          if (item === datum) {
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

    initialize: function () {
      this.recipients = {};
    }
  });
});
