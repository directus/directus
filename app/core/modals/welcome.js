define([
  'app',
  'backbone',
  'underscore',
  'core/Modal',
  'core/t',
  'utils'
], function(app, Backbone, _, Modal, __t, Utils) {

  'use strict';

  var onInputChange = function (event, fn) {
    var element = event.currentTarget;
    var $element = $(element);
    var value = $element.val();
    var currentValue = this.model.get(element.name);
    var $check = $element.next('.validate-check');

    if (!$check.length) {
      return;
    }

    var validate = function (oldValue, newValue) {
      var result = null;

      if (oldValue && !newValue) {
        result = false;
      } else if (value) {
        result = true;
      }

      return result;
    };

    var OK = null;
    if (fn !== undefined) {
      OK = fn(currentValue, value, validate);
    } else {
      OK = validate(currentValue, value);
    }

    if (OK === false) {
      $check.removeClass('valid');
    } else if (OK === true) {
      $check.addClass('valid');
    }
  };

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
      'input input': 'onInputChange',
      'click .js-change-avatar': 'onChooseAvatar',
      'change input[type=file]': 'onChangeAvatar',
      'click .js-next': 'next'
    },

    onInputChange: function () {
      onInputChange.apply(this, arguments);
    },

    onChooseAvatar: function () {
      this.$('#welcome_profile_file').click();
    },

    onChangeAvatar: function (event) {
      var target = $(event.currentTarget);
      var file = target[0].files[0];
      var model = this.model.get('avatar_file_id');

      model.setFile(file, 'image/*', _.bind(function (attributes, allowed) {
        if (!allowed) {
          Utils.clearElement(target);
        } else {
          this.$('img.avatar').attr('src', attributes.thumbnailData);
        }
      }, this));
    },

    next: function () {
      var data = this.$('form').serializeObject();
      var errors = this.model.validate(data, {validateAttributes: true});
      var fileModel = this.model.get('avatar_file_id');

      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      if (fileModel && fileModel.changedAttributes()) {
        data['avatar_file_id'] = fileModel.omitCustomAttrs(fileModel.changedAttributes());
      }

      newData = _.extend(newData, data || {});
      this.trigger('done');
    },

    serialize: function () {
      return {
        model: this.model.toJSON()
      };
    }
  });

  var Settings = Backbone.Layout.extend({
    template: 'modal/welcome/settings',

    events: {
      'input input': 'onInputChange',
      'change select, checkbox': 'onInputChange',
      'click .js-go-back': 'goBack',
      'click .js-finish': 'finish'
    },

    onInputChange: function (event) {
      var $element = $(event.currentTarget);
      var args = Array.prototype.slice.call(arguments);
      var self = this;

      newData[$element.attr('name')] = $element.val();

      if ($element.attr('name') === 'confirm_password') {
        args.push(function (oldValue, newValue, validate) {
          // validate first against the default validation
          var OK = validate(oldValue, newValue);
          var passwordValue = self.$('input[name=password]').val();
          var confirmValue = $element.val();

          if (OK && (passwordValue !== confirmValue)) {
            OK = false;
          }

          return OK;
        });
      }

      onInputChange.apply(this, args);
    },

    goBack: function () {
      this.trigger('back');
    },

    finish: function () {
      var data = this.$('form').serializeObject();
      var errors;

      if (this.model.get('password') && !data.password && !data.password) {
        data = _.omit(data, 'password', 'confirm_password');
      }

      errors = this.model.validate(data, {validateAttributes: true});

      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      if (!data.email_messages) {
        data.email_messages = 0;
      }

      newData['invite_accepted'] = 1;
      newData = _.omit(_.extend(newData, data || {}), 'confirm_password');

      this.model.save(newData, {patch: true, wait: true, validate: false});
      this.trigger('done');
    },

    serialize: function () {
      var model = this.model.toJSON();
      // remove the current password
      // if there's a password was a user entered password
      delete model.password;

      var data = _.extend(model, newData);
      var passwordPlaceholderKey = 'welcome_password_placeholder';
      // @TODO: Add more locales (Ben list has some that's not available yet)
      var timezones = _.map(app.timezones, function(name, key) {
        return {
          id: key,
          name: name,
          selected: key === data.timezone
        }
      });

      var languages = _.map(app.locales, function(language) {
        return {
          id: language.code,
          name: language.name,
          selected: language.code === data.language
        }
      });

      if (model.password) {
        passwordPlaceholderKey = 'welcome_existing_password_placeholder';
      }

      return {
        data: data,
        model: model,
        validPassword: !!data.password,
        validConfirmPassword: data.password && data.password === data.confirm_password,
        password_placeholder: __t(passwordPlaceholderKey),
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
    closeOnKey: false,
    closeOnButton: false,

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

      view.on('back', _.bind(function() {
        this.close();
        setTimeout(_.bind(function() {
          this.$el.removeClass('active slide-down ' + step.id);
          this.prev();
          this.container.show(this);
        }, this), 200);
      }, this));

      view.on('done', _.bind(function() {
        this.close();
        setTimeout(_.bind(function() {
          this.$el.removeClass('active slide-down ' + step.id);
          this.next();
          this.container.show(this);
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

    next: function () {
      this.state.step++;
    },

    prev: function () {
      this.state.step--;
    },

    cleanup: function () {
      this.fileModel.stopTracking();
    },

    initialize: function() {
      var model = this.model;

      this.options.saveOnEnter = false;
      this.fileModel = model.get('avatar_file_id');
      this.fileModel.startTracking();

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
