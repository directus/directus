define(['underscore', 'helpers/status'], function (_, StatusHelper) {

  var Base = {
    _getTableName: function () {
      var table = this.getTable();

      // if table is not defined global information will be used
      return table ? table.id : '*';
    }
  };

  var Model = _.extend(Base, {

    // gets the table status information
    getTableStatuses: function () {
      return StatusHelper.getTableStatuses(this._getTableName());
    },

    getTableStatusMapping: function () {
      var tableStatus = this.getTableStatuses();

      return tableStatus.get('mapping');
    },

    // gets model status information
    getStatus: function () {
      var statuses = this.getTableStatuses();
      var statusValue = this.getStatusValue();

      return statuses.get('mapping').get(statusValue);
    },

    // whether the records is "visible" or "fade out" in the listing
    isSubduedInListing: function () {
      var statuses = this.getStatus();

      return statuses ? statuses.get('subdued_in_listing') === true : false;
    },

    // gets this model status value
    getStatusValue: function () {
      var attr = this.table.get('status_column') || this.getTableStatuses().get('status_name');

      return this.get(attr) || this.structure.get(attr).get('default_value');
    },

    // gets this model status name
    getStatusName: function () {
      return this.getStatus().get('name');
    },

    getStatusVisible: function () {
      return StatusHelper.getStatusVisible(this._getTableName());
    },

    isDeleted: function () {
      return StatusHelper.isDelete(this._getTableName(), this.getStatusValue());
    },

    // gets this item status background color
    getStatusBackgroundColor: function () {
      // var statuses = this.getTableStatuses();
      // var statusValue = this.getStatusValue();
      // var status = statuses.get('mapping').get(statusValue);
      var status = this.getStatus();

      return status.get('background_color') || status.get('color');
    },

    // gets this item status text color
    getStatusTextColor: function () {
      // var statuses = this.getTableStatuses();
      // var statusValue = this.getStatusValue();
      //
      // return statuses.get('mapping').get(statusValue).get('text_color');

      return this.getStatus().get('text_color');
    }
  });

  var Collection = _.extend(Base, {
    // gets the table status information, otherwise global information will be used
    getTableStatuses: function () {
      return StatusHelper.getTableStatuses(this._getTableName());
    },

    getTableStatusMapping: function () {
      return StatusHelper.getTableStatusesMapping(this._getTableName());
    },

    getStatusVisible: function () {
      return StatusHelper.getStatusVisible(this._getTableName());
    },

    isHardDelete: function (statusValue) {
      return StatusHelper.isHardDelete(this._getTableName(), statusValue);
    }
  });

  return {
    Model: Model,
    Collection: Collection
  }
});
