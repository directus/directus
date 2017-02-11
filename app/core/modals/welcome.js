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
      return this.model.toJSON();
    }
  });

  var Settings = Backbone.Layout.extend({
    template: 'modal/welcome/settings',

    events: {
      'click .js-finish': 'finish'
    },

    finish: function() {
      var data = this.$('form').serializeObject();
      var errors = this.model.validate(data);

      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      newData[app.statusMapping.status_name] = app.statusMapping.active_num;
      newData = _.omit(_.extend(newData, data || {}), 'confirm_password');

      this.model.save(newData, {patch: true, validate: false});
      this.trigger('done');
    },

    serialize: function() {
      return this.model.toJSON();
    }
  });

  return Modal.extend({
    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    cropView: false,

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
