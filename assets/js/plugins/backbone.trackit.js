(function() {

  // Unsaved Record Keeping
  // ----------------------

  // Collection of all models in an app that have unsaved changes.
  var unsavedModels = [];

  // If the given model has unsaved changes then add it to
  // the `unsavedModels` collection, otherwise remove it.
  var updateUnsavedModels = function(model) {
    if (!_.isEmpty(model._unsavedChanges)) {
      if (!_.findWhere(unsavedModels, {cid:model.cid})) unsavedModels.push(model);
    } else {
      unsavedModels = _.filter(unsavedModels, function(m) { return model.cid != m.cid; });
    }
  };

  // Unload Handlers
  // ---------------

  // Helper which returns a prompt message for an unload handler.
  // Uses the given function name (one of the callback names
  // from the `model.unsaved` configuration hash) to evaluate
  // whether a prompt is needed/returned.
  var getPrompt = function(fnName) {
    var prompt, args = _.rest(arguments);
    // Evaluate and return a boolean result. The given `fn` may be a
    // boolean value, a function, or the name of a function on the model.
    var evaluateModelFn = function(model, fn) {
      if (_.isBoolean(fn)) return fn;
      return (_.isString(fn) ? model[fn] : fn).apply(model, args);
    };
    _.each(unsavedModels, function(model) {
      if (!prompt && evaluateModelFn(model, model._unsavedConfig[fnName]))
        prompt = model._unsavedConfig.prompt;
    });
    return prompt;
  };

  // Wrap Backbone.History.navigate so that in-app routing
  // (`router.navigate('/path')`) can be intercepted with a
  // confirmation if there are any unsaved models.
  Backbone.History.prototype.navigate = _.wrap(Backbone.History.prototype.navigate, function(oldNav, fragment, options) {
    var prompt = getPrompt('unloadRouterPrompt', fragment, options);
    if (prompt) {
      if (confirm(prompt + ' \n\nAre you sure you want to leave this page?')) {
        oldNav.call(this, fragment, options);
      }
    } else {
      oldNav.call(this, fragment, options);
    }
  });

  // Create a browser unload handler which is triggered
  // on the refresh, back, or forward button.
  window.onbeforeunload = function(e) {
    return getPrompt('unloadWindowPrompt', e);
  };

  // Backbone.Model API
  // ------------------

  _.extend(Backbone.Model.prototype, {

    unsaved: {},
    _trackingChanges: false,
    _originalAttrs: {},
    _unsavedChanges: {},

    // Opt in to tracking attribute changes
    // between saves.
    startTracking: function() {
      this._unsavedConfig = _.extend({}, {
        prompt: 'You have unsaved changes!',
        unloadRouterPrompt: false,
        unloadWindowPrompt: false
      }, this.unsaved || {});
      this._trackingChanges = true;
      this._resetTracking();
      this._triggerUnsavedChanges();
      return this;
    },

    // Resets the default tracking values
    // and stops tracking attribute changes.
    stopTracking: function() {
      this._trackingChanges = false;
      this._originalAttrs = {};
      this._unsavedChanges = {};
      this._triggerUnsavedChanges();
      return this;
    },

    // Gets rid of accrued changes and
    // resets state.
    restartTracking: function() {
      this._resetTracking();
      this._triggerUnsavedChanges();
      return this;
    },

    // Restores this model's attributes to
    // their original values since tracking
    // started, the last save, or last restart.
    resetAttributes: function() {
      if (!this._trackingChanges) return;
      this.set(this._originalAttrs);
      this._resetTracking();
      this._triggerUnsavedChanges();
      return this;
    },

    // Symmetric to Backbone's `model.changedAttributes()`,
    // except that this returns a hash of the model's attributes that
    // have changed since the last save, or `false` if there are none.
    // Like `changedAttributes`, an external attributes hash can be
    // passed in, returning the attributes in that hash which differ
    // from the model.
    unsavedAttributes: function(attrs) {
      if (!attrs) return _.isEmpty(this._unsavedChanges) ? false : _.clone(this._unsavedChanges);
      var val, changed = false, old = this._unsavedChanges;
      for (var attr in attrs) {
        if (_.isEqual(old[attr], (val = attrs[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    _resetTracking: function() {
      this._originalAttrs = _.clone(this.attributes);
      this._unsavedChanges = {};
    },

    // Trigger an `unsavedChanges` event on this model,
    // supplying the result of whether there are unsaved
    // changes and a changed attributes hash.
    _triggerUnsavedChanges: function() {
      this.trigger('unsavedChanges', !_.isEmpty(this._unsavedChanges), _.clone(this._unsavedChanges), this);
      if (this.unsaved) updateUnsavedModels(this);
    }
  });

  // Wrap `model.set()` and update the internal
  // unsaved changes record keeping.
  Backbone.Model.prototype.originalSet = Backbone.Model.prototype.set;
  Backbone.Model.prototype.set = _.wrap(Backbone.Model.prototype.set, function(oldSet, key, val, options) {
    var attrs, ret;
    if (key == null) return this;
    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }
    options || (options = {});

    // Delegate to Backbone's set.
    ret = oldSet.call(this, attrs, options);

    if (this._trackingChanges && !options.silent && !options.trackit_silent) {
      for (key in attrs) {
        val = attrs[key];
        if (_.isEqual(this._originalAttrs[key], val))
          delete this._unsavedChanges[key];
        else
          this._unsavedChanges[key] = val;
      }
      this._triggerUnsavedChanges();
    }
    return ret;
  });

  // Intercept `model.save()` and reset tracking/unsaved
  // changes if it was successful.
  Backbone.sync = _.wrap(Backbone.sync, function(oldSync, method, model, options) {
    options || (options = {});

    if (method == 'update' || method == 'create' || method == 'patch') {
      options.success = _.wrap(options.success, _.bind(function(oldSuccess, data, textStatus, jqXHR) {
        var ret;
        if (oldSuccess) ret = oldSuccess.call(this, data, textStatus, jqXHR);
        if (model._trackingChanges) {
          model._resetTracking();
          model._triggerUnsavedChanges();
        }
        return ret;
      }, this));
    }
    return oldSync(method, model, options);
  });

})();
