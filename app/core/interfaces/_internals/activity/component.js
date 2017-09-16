define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function (app, UIComponent, UIView, __t) {
  return UIComponent.extend({
    id: 'directus_activity',
    system: true,
    Input: UIView,
    list: function (interfaceOptions) {
      var model = interfaceOptions.model;
      var action = model.get('action');
      var table = model.get('table_name');
      var type = model.get('type');
      var returnStr;

      var identifier = model.get('identifier');
      if (identifier === null) {
        identifier = __t('directus_activity_entry_') + ' #' + model.get('row_id');
      }

      switch (type) {
        case 'FILES':
          returnStr = '<a href="#" data-action="files" data-id="' + model.get('row_id') + '">' + identifier + '</a> ' + __t('directus_activity_action', {action: app.actionMap[action], preposition: app.prepositionMap[action]}) + ' <a href="#files">' + __t('files') + '</a>';
          break;
        case 'SETTINGS':
          returnStr = __t('directus_activity_this_settings_has_been_updated');
          break;
        case 'UI':
          returnStr = __t('directus_activity_a_ui_has_been_updated');
          break;
        default:
          var targetObjectPath;
          if (table === 'directus_users') {
            targetObjectPath = 'users/' + model.get('row_id');
          } else {
            targetObjectPath = '#tables/' + table + '/' + model.get('row_id');
          }
          returnStr =
            '<a href="' + targetObjectPath + '">' + identifier + ' </a>' +
            __t('directus_activity_action', {action: app.actionMap[action], preposition: app.prepositionMap[action]}) +
            ' <a href="#tables/' + table + '">' + app.capitalize(table) + '</a>';
          break;
      }

      return returnStr;
    }
  });
});
