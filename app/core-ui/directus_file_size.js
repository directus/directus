//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

	var Component = UIComponent.extend({
    id: 'directus_file_size',
    system: true,
    Input: UIView,
    list: function(options) {
      return app.bytesToSize(options.value);
    }
  });

  return Component;
});
