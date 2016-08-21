//  Directus User Activity List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'moment', 'core/t'], function(app, UIComponent, UIView, moment, __t) {

  'use strict';

  var Component = UIComponent.extend({
    id: 'directus_user_activity',
    system: true,
    sortBy: 'last_login',
    Input: UIView,
    list: function(options) {
      if(options.model.get('last_access') !== null){
        var page_summary = '';
        var last_page = $.parseJSON(options.model.get('last_page')) || {};
        if(undefined === last_page.param) {
          page_summary += __t('directus_user_activity_route_action', {
            route: app.capitalize(last_page.route)
          });
        } else {
          switch(last_page.route) {
            case "entries":
              page_summary += __t('directus_user_activity_table_entries_action', {
                param: app.capitalize(last_page.param)
              });
              break;
            case "entry":
              var detailType = __t('action_edit');
              if("new" === last_page.path.substr(-3))
                detailType = __t('action_create');
              page_summary += __t('directus_user_activity_table_entry_action', {
                param: app.capitalize(last_page.param),
                action: detailType
              });
              break;
            case "user":
              page_summary += __t('directus_user_activity_user_edit_form');
              break;
          }
        }
        var activity_time = options.model.get('last_access');
        return '<a href="#'+last_page.path+'" title="'+activity_time+'">'+page_summary+' '+moment(activity_time).fromNow()+'</a>';
      } else {
        return '<a href="#">'+__t("directus_user_activity_never_logged_in")+'</a>';
      }
    }
  });

  return Component;
});
