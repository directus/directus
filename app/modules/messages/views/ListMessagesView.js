define([
  'app',
  'backbone',
  'core/t',
  'core/basePageView',
  'core/widgets/widgets',
  'moment'
],

function(app, Backbone, __t, BasePageView, Widgets, moment) {

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    events: {
      'click .message': function(e) {
        var id = $(e.target).closest('.message').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var data = this.collection.map(function(model) {
        var data = model.toJSON();
        var momentDate = moment(data.date_updated);
        data.timestamp = parseInt(momentDate.format('X'), 10);
        data.niceDate = moment().diff(momentDate, 'days') > 1 ? momentDate.format('MMMM D') : momentDate.fromNow();
        data.read = model.getUnreadCount() === 0;
        data.responsesLength = data.responses.length;
        data.from = parseInt(data.from, 10);

        if(data.recipients) {
          var recipients = data.recipients.split(',');
        } else {
          var recipients = [];
        }

        data.recipients = [];
        var extra = 0;

        for(var i=0; i<recipients.length; i++) {
          if(i > 2) {
            extra = recipients.length - i;
            break;
          }

          var user = app.users.get(recipients[i]);
          if (user !== undefined) {
            data.recipients.push(user.get('first_name'));
          }
        }

        data.recipients = data.recipients.join(", ");

        if(extra) {
          data.recipients += " (+"+extra+" more)";
        }

        //console.log(_.map(data.responses, 'from'));
        return data;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -item.timestamp;
      });

      return {messages: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('messages')
      }
    },
    leftToolbar: function() {
      return [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "add", buttonClass: "", buttonText: __t('new_message')}})
      ];
    },
    rightToolbar: function() {
      return [
        //new Widgets.SearchWidget()
      ];
    },

    events: {
      'click #addBtn': function() {
        app.router.go('#messages','new');
      }
    },

    serialize: function() {
      return {
        title: 'Messages',
        buttonTitle: 'Compose'
      };
    },

    beforeRender: function() {
      var view = new ListView({collection: this.collection});
      this.setView('#page-content', view);
      BasePageView.prototype.beforeRender.call(this);
    }
  });
});
