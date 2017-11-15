define([
  'core/interfaces/numeric/interface',
  'utils'
], function (Numeric, Utils) {

  'use strict';

  return Numeric.extend({
    unsavedChange: function () {
      var value = this.model.get(this.name);

      if (Utils.isSomething(value) && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return value;
      }
    }
  });
});
