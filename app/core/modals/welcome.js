define(['app', 'backbone', 'underscore', 'core/Modal', 'core/t'], function(app, Backbone, _, Modal, __t) {

  'use strict';

  var newData = {};

  var Welcome = Backbone.Layout.extend({
    template: 'modal/welcome/welcome',

    events: {
      'click .js-start': 'start'
    },

    start: function() {
      this.trigger('done');
    },

    serialize: function() {
      return this.model.toJSON();
    }
  });

  var Profile = Backbone.Layout.extend({
    template: 'modal/welcome/profile',

    events: {
      'click .js-next': 'next'
    },

    next: function() {
      var data = this.$('form').serializeObject();
      var errors = this.model.validate(data);

      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      newData = _.extend(newData, data || {});
      this.trigger('done');
    },

    serialize: function() {
      return {
        model: this.model.toJSON()
      };
    }
  });

  var Settings = Backbone.Layout.extend({
    template: 'modal/welcome/settings',

    events: {
      'click .js-finish': 'finish'
    },

    finish: function() {
      var data = this.$('form').serializeObject();
      var errors;

      if (this.model.get('password')) {
        data = _.omit(data, 'password', 'confirm_password');
      }

      errors = this.model.validate(data);

      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      if (!data.email_messages) {
        data.email_messages = 0;
      }

      newData['invite_accepted'] = 1;
      newData = _.omit(_.extend(newData, data || {}), 'confirm_password');

      this.model.save(newData, {patch: true, validate: false});
      this.trigger('done');
    },

    serialize: function() {
      var model = this.model.toJSON();
      // @TODO: Add more locales (Ben list has some that's not available yet)
      var timezones = _.map(app.timezones, function(name, key) {
        return {
          id: key,
          name: name,
          selected: key === model.timezone
        }
      });

      var languages = _.map(app.locales, function(language) {
        return {
          id: language.code,
          name: language.name,
          selected: language.code === model.language
        }
      });

      return {
        model: model,
        disablePassword: !!model.password,
        timezones: timezones,
        languages: languages
      };
    }
  });

  return Modal.extend({
    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    cropView: false,

    closeOnBackground: false,

    serialize: function() {
      return this.model.toJSON();
    },

    beforeRender: function() {
      var step = this.getStep();

      if (!step) {
        this.close(true);
        return;
      }

      var view = _.result(step, 'view');

      view.on('done', _.bind(function() {
        this.close();
        setTimeout(_.bind(function() {
          this.$el.removeClass('active slide-down ' + step.id);
          this.next();
          this.render();
        }, this), 200);
      }, this));

      this.on('afterRender', _.bind(function() {
        this.$el.addClass('active');
      }, this));

      this.showCurrent();
    },

    showCurrent: function() {
      var step = this.getStep();
      var view = _.result(step, 'view');

      this.$el.addClass(step.id);
      this.setView('.modal-bg', view);
    },

    getStep: function() {
      var stepIndex = this.state.step;
      var step = this.steps[stepIndex];

      if (step) {
        step.view = _.result(step, 'view');
      }

      return step;
    },

    next: function() {
      this.state.step++;
    },

    initialize: function() {
      var model = this.model;

      this.state = {
        step: 0
      };

      this.steps = [{
        id: 'welcome-1',
        view: function () {
          return new Welcome({model: model})
        }
      }, {
        id: 'welcome-2',
        view: function () {
          return new Profile({model: model});
        }
      }, {
        id: 'welcome-3',
        view: function () {
          return new Settings({model: model});
        }
      }];
    }
  });
});
