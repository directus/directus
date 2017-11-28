define([
  'core/interfaces/numeric/interface',
  'utils'
], function (Numeric, Utils) {

  'use strict';

  return Numeric.extend({
    unsavedChange: function () {
      var value = this.model.get(this.name);

      if (this.model.isNew() || this.model.hasChanges(this.name)) {
        // if the value is "falsy" and the column is nullable replace the value to 0
        if (Utils.isNothing(value) && !this.columnSchema.isNullable()) {
          value = 0;
        }

        if (Utils.isSomething(value)) {
          return value
        }
      }
    }
  });
});
