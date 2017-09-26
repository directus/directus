/* global $ */
define(['app', 'core/UIComponent', 'core/UIView', 'moment', 'core/t'], function (app, UIComponent, UIView, moment, __t) {
  return UIComponent.extend({
    id: 'directus_user_activity',
    system: true,
    sortBy: 'last_login',
    Input: UIView,
    list: function (interfaceOptions) {
      if (interfaceOptions.model.get('last_access') !== null) {
        var pageSummary = '';
        var lastPage = $.parseJSON(interfaceOptions.model.get('last_page')) || {};
        if (undefined === lastPage.param) {
          pageSummary += __t('directus_user_activity_route_action', {
            route: app.capitalize(lastPage.route)
          });
        } else {
          switch (lastPage.route) {
            case 'entries':
              pageSummary += __t('directus_user_activity_table_entries_action', {
                param: app.capitalize(lastPage.param)
              });
              break;
            case 'entry':
              var detailType = __t('action_edit');
              if (lastPage.path.substr(-3) === 'new') {
                detailType = __t('action_create');
              }
              pageSummary += __t('directus_user_activity_table_entry_action', {
                param: app.capitalize(lastPage.param),
                action: detailType
              });
              break;
            case 'user':
              pageSummary += __t('directus_user_activity_user_edit_form');
              break;
            default:
              break;
          }
        }
        var activityTime = interfaceOptions.model.get('last_access');
        return '<a href="#' + lastPage.path + '" title="' + activityTime + '">' + pageSummary + ' ' + moment(activityTime).fromNow() + '</a>';
      }
      return '<a href="#">' + __t('directus_user_activity_never_logged_in') + '</a>';
    }
  });
});
