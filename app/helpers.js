require([
  'app',
  'handlebars',
  'core/UIManager',
  'helpers/file',
  'core/t',
  'moment'
], function(app, Handlebars, UIManager, FileHelper, __t, moment) {

  'use strict';

  // Get assets path
  Handlebars.registerHelper('assetsPath', function() {
    return app.PATH + 'assets';
  });

  // Get root path
  function rootPath() {
    return app.PATH;
  }

  Handlebars.registerHelper('rootPath', rootPath);
  Handlebars.registerHelper('rootUrl', rootPath);

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
    if (date === undefined || date === null) {
      return '-';
    }

    return moment(date).fromNow();
  });

  Handlebars.registerHelper('formatDate', function(date, format) {
    return moment(date).format(format);
  });

  Handlebars.registerHelper('friendlyDateTime', function(date) {
    return moment(date).format('dddd, MMM DD, h:mm A');
  });

  Handlebars.registerHelper('readableBytesSize', function(bytes) {
    return FileHelper.readableBytes(bytes);
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

  // Get the model status name
  Handlebars.registerHelper('statusName', function(model) {
    var statusValue = model.get(app.statusMapping.status_name);
    var status = app.statusMapping.mapping[statusValue] || {};

    return status ? status.name : '';
  });

  // Get the model status color
  Handlebars.registerHelper('statusColor', function(model) {
    var statusValue = model.get(app.statusMapping.status_name);
    var status = app.statusMapping.mapping[statusValue] || {};

    return status ? status.color : '#eeeeee';
  });

  Handlebars.registerHelper('notPublishedClass', function(model) {
    if (model.get(app.statusMapping.status_name) == app.statusMapping.draft_num) {
      return 'not-published';
    }

    return '';
  });

  // Should be combined with userShort below with param: "show_avatar" [true,false]
  Handlebars.registerHelper('userName', function(userId) {
    if (_.isNaN(userId)) return;
    var user = app.users.get(userId);
    var firstName = user.get('first_name').toLowerCase();
    var lastNameFirstCharacter = user.get('last_name').toLowerCase().charAt(0);
    var nickName = firstName;
    var hit = app.users.find(function(model) {
      return model.get('first_name').toLowerCase() === firstName && model.id !== userId;
    });
    if (hit !== undefined) {
      nickName = firstName + ' ' + lastNameFirstCharacter + '.';
      hit = app.users.find(function(model) { return model.get('first_name').toLowerCase() === firstName && model.get('last_name').toLowerCase().charAt(0) === lastNameFirstCharacter && model.id !== userId; });
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
      return model.get('first_name').toLowerCase() === firstName && model.id !== userId;
    });
    if (hit !== undefined) {
      nickName = firstName + ' ' + lastNameFirstCharacter + '.';
      hit = app.users.find(function(model) { return model.get('first_name').toLowerCase() === firstName && model.get('last_name').toLowerCase().charAt(0) === lastNameFirstCharacter && model.id !== userId; });
      if (hit !== undefined) {
        nickName = firstName + ' ' + user.get('last_name');
      }
    }
    return new Handlebars.SafeString('<img src="'+user.getAvatar()+'" class="avatar"/>' + app.capitalize(nickName," "));
  });

  Handlebars.registerHelper('userAvatarUrl', function(userId) {
    return app.users.get(userId).getAvatar();
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

  var userFirstAndLastName = function(userId) {
    var user = app.users.get(userId);

    return new Handlebars.SafeString(user.get('first_name')+' '+user.get('last_name'));
  };
  Handlebars.registerHelper('userFirstAndLastName', userFirstAndLastName);

  Handlebars.registerHelper('usersFirstAndLastName', function(userIds) {
    if (!_.isArray(userIds)) {
      return;
    }

    var result = [];
    _.each(userIds, function(userId, index) {
      var user = userFirstAndLastName(userId);
      var prefix = ', ';

      if (userIds.length && userIds.length === (index + 1)) {
        prefix = ' and ';
      } else if (index === 0) {
        prefix = '';
      }

      result.push(prefix + user);
    });

    return result.join('');
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

  // Handlebars UI helper!
  function uiHelper(model, attr, options) {
    var html;

    if (model.isNested) {
      model = model.get('data');
    }

    html = UIManager.getList(model, attr) || '';

    return new Handlebars.SafeString(html);
  }

  Handlebars.registerHelper('ui', uiHelper);

  Handlebars.registerHelper('uiCapitalize', function(model, attr, options) {
    var value = uiHelper(model, attr, options);

    if (_.isString(value)) {
      value = app.capitalize(value);
    }

    return value;
  });

  // include an partial
  Handlebars.registerHelper('include', function (path, options) {
    var partial = Handlebars.partials[path];
    if (typeof partial !== 'function') {
      partial = Handlebars.compile(partial);
    }

    return Handlebars.compile(partial())();
  });

  // template for empty listing
  Handlebars.registerPartial('listingEmpty', function() {
    return '<div class="no-items"> \
      <div class="background-circle"> \
      <img src="{{assetsPath}}/imgs/no-items.svg"> \
      </div> \
      <br> \
      {{t "listing_items_not_found"}} \
    </div>';
  });
});
