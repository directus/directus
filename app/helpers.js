require([
  "app",
  "handlebars",
  "core/UIManager",
  'core/t',
  'moment'
], function(app, Handlebars, UIManager, __t, moment) {

  "use strict";

  Handlebars.registerHelper('imagesPath', function() {
    return app.PATH + 'assets/img/';
  });

  Handlebars.registerHelper('t', function(key, options) {
    return __t(key, options.hash);
  });

  Handlebars.registerHelper('tCoreField', function(key, options) {
    if (options.hash.table) {
      var tableKey = options.hash.table+'_'+key;
      if (__t.polyglot.has(tableKey)) {
        key = tableKey;
      }
    }

    return app.capitalize(__t(key, options.hash));
  });

  Handlebars.registerHelper('tVarCapitalize', function(key, options) {
    for (var index in options.hash) {
      if (!options.hash.hasOwnProperty(index)) {
        continue;
      }

      options.hash[index] = app.capitalize(options.hash[index]);
    }

    return __t(key, options.hash);
  });

  //Raw handlebars data, helpful with data types
  Handlebars.registerHelper('raw', function(data) {
    return data && new Handlebars.SafeString(data);
  });

  Handlebars.registerHelper('number', function(number) {
    return number === undefined ? '' : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  });

  Handlebars.registerHelper('resource', function(name) {
    return app.RESOURCES_URL + name;
  });

  Handlebars.registerHelper('capitalize', function(string) {
    return app.capitalize(string);
  });

  Handlebars.registerHelper('nl2br', function(string) {
    return (string + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  });

  Handlebars.registerHelper('uppercase', function(string) {
    return string.toUpperCase();
  });

  Handlebars.registerHelper('bytesToSize', function(bytes) {
    return app.bytesToSize(bytes, 0);
  });

  Handlebars.registerHelper('contextualDate', function(date) {
    if(date === undefined || date === null) {
      //throw new Error('The date is not in a correct date format');
      return '-';
    }
    //date = (date.substr(-1).toLowerCase() == 'z') ? date : date + 'z';
    return new Handlebars.SafeString('<div class="contextual-date" title="'+ new Date(date) +'">' + moment(date).fromNow() + '</div>');
  });

  Handlebars.registerHelper('formatDate', function(date, format) {
    return moment(date).format(format);
  });

  Handlebars.registerHelper('avatarSmall', function(userId) {
    var user = app.users.get(userId);
    return '<img src="' + user.getAvatar() + '" style="margin-right:7px;" class="avatar">' + user.get('first_name');
  });

  Handlebars.registerHelper('activeMap', function(model) {
    //@todo: how do we want to handle this stuff
    switch (model.get(app.statusMapping.status_name)) {
      case 0:
        return 'deleted';
      case 1:
        return 'active';
      case 2:
        return 'inactive';
    }
  });

  // Should be combined with userShort below with param: "show_avatar" [true,false]
  Handlebars.registerHelper('userName', function(userId) {
    if (_.isNaN(userId)) return;
    var user = app.users.get(userId);
    var firstName = user.get('first_name').toLowerCase();
    var lastNameFirstCharacter = user.get('last_name').toLowerCase().charAt(0);
    var nickName = firstName;
    var hit = app.users.find(function(model) {
      return model.get('first_name').toLowerCase() === firstName && model.id != userId;
    });
    if (hit !== undefined) {
      nickName = firstName + ' ' + lastNameFirstCharacter + '.';
      hit = app.users.find(function(model) { return model.get('first_name').toLowerCase() === firstName && model.get('last_name').toLowerCase().charAt(0) === lastNameFirstCharacter && model.id != userId; });
      if (hit !== undefined) {
        nickName = firstName + ' ' + user.get('last_name');
      }
    }
    return new Handlebars.SafeString(app.capitalize(nickName," "));
  });

  Handlebars.registerHelper('userShort', function(userId) {
    if (_.isNaN(userId)) return;
    var user = app.users.get(userId);
    var firstName = user.get('first_name').toLowerCase();
    var lastNameFirstCharacter = user.get('last_name').toLowerCase().charAt(0);
    var nickName = firstName;
    var hit = app.users.find(function(model) {
      return model.get('first_name').toLowerCase() === firstName && model.id != userId;
    });
    if (hit !== undefined) {
      nickName = firstName + ' ' + lastNameFirstCharacter + '.';
      hit = app.users.find(function(model) { return model.get('first_name').toLowerCase() === firstName && model.get('last_name').toLowerCase().charAt(0) === lastNameFirstCharacter && model.id != userId; });
      if (hit !== undefined) {
        nickName = firstName + ' ' + user.get('last_name');
      }
    }
    return new Handlebars.SafeString('<img src="'+user.getAvatar()+'" class="avatar"/>' + app.capitalize(nickName," "));
  });

  Handlebars.registerHelper('userAvatar', function(userId) {
    var user = app.users.get(userId);
    var avatar = user.getAvatar();

    return new Handlebars.SafeString('<img src="'+avatar+'" class="avatar" title="'+user.get('first_name')+' '+user.get('last_name')+'"/>');
  });

  Handlebars.registerHelper('userFull', function(userId) {
    var user = app.users.get(userId);
    return new Handlebars.SafeString('<img src="'+user.getAvatar()+'"  class="avatar"/><span class="avatar-name">'+user.get('first_name')+' '+user.get('last_name')+'</span>');
  });

  Handlebars.registerHelper('userFirstAndLastName', function(userId) {
    var user = app.users.get(userId);
    return new Handlebars.SafeString(user.get('first_name')+' '+user.get('last_name'));
  });

  Handlebars.registerHelper('directusTable', function(data) {

    if (data === undefined || !data.length) return;

    var headers = _.keys(data[0]);

    var headersTH = _.map(headers, function(header) { return '<th>' + app.capitalize(header, '_') + '</th>'; });

    var tHead = '<thead><tr>' + headersTH.join('') + '</tr></thead>';

    var tableRows = _.map(data, function(row) {
      //wrap values in td
      var values = _.values(row);
      var tds = _.map(values, function(value) { return '<td>' + value + '</td>'; });
      return '<tr>' + tds.join('') + '</tr>';
    });

    var tBody = '<tbody>' + tableRows.join('') + '</tbody>';

    var table = '<table class="table table-striped directus-table">' + tHead + tBody + '</table>';

    return new Handlebars.SafeString(table);
  });

  Handlebars.registerHelper('directusTable', function(data) {

    if (data === undefined || !data.length) return;

    var headers = _.keys(data[0]);

    var headersTH = _.map(headers, function(header) { return '<th>' + app.capitalize(header, '_') + '</th>'; });

    var tHead = '<thead><tr>' + headersTH.join('') + '</tr></thead>';

    var tableRows = _.map(data, function(row) {
      //wrap values in td
      var values = _.values(row);
      var tds = _.map(values, function(value) { return '<td>' + value + '</td>'; });
      return '<tr>' + tds.join('') + '</tr>';
    });

    var tBody = '<tbody>' + tableRows.join('') + '</tbody>';

    var table = '<table class="table table-striped directus-table">' + tHead + tBody + '</table>';

    return new Handlebars.SafeString(table);
  });

  Handlebars.registerHelper('directusSelect', function(data) {
    if (data === undefined) return;

    var name = data.name;
    data = data.options;

    var options = _.map(data, function(item) {
      var selected = item.selected ? 'selected' : '';
      return '<option value="' + item.name + '" ' + selected + '>' + item.title + '</option>';
    });

    var select = '<select id="' + name + '">' + options.join('') + '</select>';

    return new Handlebars.SafeString(select);
  });

  //Handlebars UI helper!
  Handlebars.registerHelper("ui", function(model, attr, options) {
    if (model.isNested) model = model.get('data');
    var html = UIManager.getList(model, attr) || '';
    return new Handlebars.SafeString(html);
  });

});
