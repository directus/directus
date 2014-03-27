define([
  'modules/users/views/EditUserView',
  'modules/users/views/ListUsers'
],

function(EditUserView, ListUsers) {

  'use strict';

  var Users = app.module();

  Users.Views.Edit = EditUserView;
  Users.Views.List = ListUsers;

  return Users;

});