//  Directus User Activity List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'moment'], function(app, UIComponent, UIView, moment) {

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
          page_summary += app.capitalize(last_page.route) + " index";
        } else {
          switch(last_page.route) {
            case "entries":
              page_summary += app.capitalize(last_page.param) + " table index";
              break;
            case "entry":
              var detailType = "edit";
              if("new" == last_page.path.substr(-3))
                detailType = "create";
              page_summary += app.capitalize(last_page.param) + " table entry " + detailType;
              break;
            case "user":
              page_summary += "User edit form";
              break;
          }
        }
        var activity_time = options.model.get('last_access');
        return '<a href="#'+last_page.path+'" title="'+activity_time+'">'+page_summary+' '+moment(activity_time).fromNow()+'</a>';
      } else {
        return '<a href="#">Never logged in</a>';
      }
    }
  });

  return Component;
});
