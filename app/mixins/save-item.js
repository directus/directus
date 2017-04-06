define(['app'], function (app) {
  return {
    saveWithDeleteStatus: function () {
      var attributes = {};
      var status = this.getTableStatuses();
      var statusColumnName = this.table.getStatusColumnName();
      var xhr;

      if (statusColumnName) {
        attributes[statusColumnName] = status.getDeleteValue();
        xhr = this.save(attributes, {patch: true})
      } else {
        xhr = this.destroy();
      }

      return xhr;
    }
  }
});
