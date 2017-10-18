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
      // TODO: Make this return null if there's not status column in the table
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
      var value = this.get(attr);
      var column;

      if (value === undefined && this.structure) {
        if (column = this.structure.get(attr)) {
          value = column.get('default_value');
        }
      }

      return value;
    },

    // gets this model status name
    getStatusName: function () {
      return this.getStatus().get('name');
    },

    getTableStatusesMapping: function () {
      return StatusHelper.getTableStatusesMapping(this._getTableName());
    },

    getStatusVisible: function () {
      return StatusHelper.getStatusVisible(this._getTableName());
    },

    isStatusVisible: function (status) {
      return StatusHelper.isStatusVisible(this._getTableName(), status);
    },

    getStatusVisibleValues: function () {
      return StatusHelper.getStatusVisibleValues(this._getTableName());
    },

    // has visible status
    isVisible: function (checkPreferences) {
      var visible = true;
      var model = this;
      var visibleStatus = this.getStatusVisibleValues();
      var preferences = this.collection.preferences;

      if (checkPreferences === true && preferences) {
        // TODO: make all status id be number
        visibleStatus = _.intersection(_.map(preferences.getStatuses(), Number), visibleStatus);
      }

      if (this.table.hasStatusColumn()) {
        visible = false;
        _.each(visibleStatus, function (value) {
          if (model.getStatusValue() == value) {
            visible = true;
          }
        });
      }

      return visible;
    },

    isDeleted: function () {
      return StatusHelper.isDelete(this._getTableName(), this.getStatusValue());
    },

    // gets this item status background color
    getStatusBackgroundColor: function () {
      var status = this.getStatus();

      return status.get('background_color') || status.get('color');
    },

    // gets this item status text color
    getStatusTextColor: function () {
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

    getStatusVisibleValues: function () {
      return StatusHelper.getStatusVisibleValues(this._getTableName());
    },

    visibleCount: function (checkPreferences) {
      var count = 0;

      this.each(function (model) {
        if (model.isVisible(checkPreferences)) {
          count++;
        }
      });

      return count;
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
