define([
  'utils',
  'core/entries/EntriesModel'
], function (Utils, EntriesModel) {

  return EntriesModel.extend({

    isPublic: function () {
      return this.get('name').toLowerCase() === 'public';
    },

    isAdmin: function () {
      return this.id === 1;
    },

    canEdit: function (attr) {
      var _canEdit = EntriesModel.prototype.canEdit;

      if (attr === 'name' && !this.isNew()) {
        return false;
      }

      return _canEdit.apply(this, arguments);
    },

    canDelete: function () {
      return EntriesModel.prototype.canDelete.apply(this, arguments) && !this.isPublic() && !this.isAdmin();
    },

    getNavBlacklist: function () {
      var blacklisted = Utils.parseCSV(this.get('nav_blacklist'));

      return blacklisted.map(function (name) {
        return name.toLowerCase();
      });
    },

    isReadBlacklisted: function (attribute) {
      var _isReadBlacklisted = EntriesModel.prototype.isReadBlacklisted;

      // omit users interface from public groups editing page
      if (this.isPublic() && attribute === 'users') {
        return true;
      }

      return _isReadBlacklisted.apply(this, arguments);
    },

    fetch: function (options) {
      var _fetch = EntriesModel.prototype.fetch;

      if (!options.data) {
        options.data = {};
      }

      // Include users relational columns
      options.data.depth = 3;

      return _fetch.apply(this, [options]);
    }
  });
});
