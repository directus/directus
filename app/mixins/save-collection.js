define(['app', 'underscore'], function (app, _) {
  return {
    saveWithStatus: function (statusValue, options) {
      var attributes = {};
      var statusColumnName = this.getTable().getStatusColumnName();
      var isHardDelete = !statusColumnName || this.isHardDelete(statusValue);

      options = options || {};

      attributes[statusColumnName] = statusValue;

      this.each(function (model) {
        if (model.has(statusColumnName)) {
          model.set(attributes);
        }
      });

      if (isHardDelete) {
        this.destroy(null, options);
      } else {
        this.save(null, _.extend({
          patch: true,
          validate: false,
          wait: true
        }, options));
      }
    },

    saveWithDeleteStatus: function (options) {
      var deleteValue = this.getTableStatuses().getDeleteValue();

      return this.saveWithStatus(deleteValue, options);
    }
  }
});
