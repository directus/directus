define(['app'], function (app) {
  return {
    saveWithDeleteStatus: function () {
      var attributes = {};
      var statuses = this.getTableStatuses();
      var statusColumnName = this.table.getStatusColumnName();
      var status, options, xhr;

      options = {wait: true};

      if (statusColumnName) {
        attributes[statusColumnName] = statuses.getDeleteValue();
        status = statuses.get('mapping').get(attributes[statusColumnName]);

        options.patch = true;
        if (status.get('enforce_validation') !== true) {
          options.validate = false;
        }

        xhr = this.save(attributes, options);
      } else {
        xhr = this.destroy(options);
      }

      return xhr;
    }
  }
});
