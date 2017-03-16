//  messages.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
define([
  'app',
  'modules/messages/views/ListMessagesView',
  'modules/messages/views/NewMessageView',
  'modules/messages/views/MessageView',
  'modules/messages/MessageCollection'
],

function(app, ListMessagesView, NewMessageView, MessageView, MessageCollection) {

  'use strict';

  var Messages = app.module();

  Messages.Views.New = NewMessageView;
  Messages.Views.Content = MessageView;
  Messages.Views.List = ListMessagesView;
  Messages.Collection = MessageCollection;

  return Messages;
});
