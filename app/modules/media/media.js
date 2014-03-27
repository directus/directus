define([
  'modules/media/views/EditMediaView',
  'modules/media/views/MediaTableView',
],

function(EditMediaView, MediaTableView) {

  "use strict";

  var media = app.module();

  media.Views.Edit = EditMediaView;
  media.Views.List = MediaTableView;

  return media;

});