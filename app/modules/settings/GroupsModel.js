define(['core/entries/EntriesModel'], function(EntriesModel) {

  return EntriesModel.extend({

    canEdit: function (attr) {
      var _canEdit = EntriesModel.prototype.canEdit;

      if (attr === 'name' && !this.isNew()) {
        return false;
      }

      return _canEdit.apply(this, arguments);
    }
  });
});
