define([
  'core/interfaces/numeric/interface',
  'utils'
], function (Numeric, Utils) {

  'use strict';

  return Numeric.extend({
    beforeSaving: function () {
      var value = this.model.get(this.name);

      if (Utils.isNothing(value) && !this.columnSchema.isNullable()) {
        return 0;
      }
    }
  });
});
