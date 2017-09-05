define(['app', 'core/UIComponent', 'core/UIView'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'directus_file_size',
    system: true,
    Input: UIView,
    list: function (interfaceOptions) {
      return app.bytesToSize(interfaceOptions.value);
    }
  });
});
