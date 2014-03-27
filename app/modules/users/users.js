define([
  'app',
  'modules/users/views/EditUserView',
  'modules/users/views/ListUsers'
],

function(app, EditUserView, ListUsers) {

  'use strict';

  var users = app.module();

  users.Views.Edit = EditUserView;
  users.Views.List = ListUsers;

  return users;
});