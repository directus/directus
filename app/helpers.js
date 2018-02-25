require([
  'app',
  'underscore',
  'handlebars',
  'core/UIManager',
  'helpers/file',
  'helpers/status',
  'helpers/string',
  'core/t',
  'moment'
], function (app, _, Handlebars, UIManager, FileHelper, StatusHelper, StringHelper, __t, moment) {

  'use strict';

  // Get assets path
  Handlebars.registerHelper('assetsPath', function () {
    return app.PATH + 'assets';
  });

  // Get root path
  function rootPath() {
    return app.PATH;
  }

  Handlebars.registerHelper('rootPath', rootPath);
  Handlebars.registerHelper('rootUrl', rootPath);

  Handlebars.registerHelper('t', function (key, options) {
    return __t(key, options.hash);
  });

  Handlebars.registerHelper('tCoreField', function (key, options) {
    var value = key;
    var tableKey;

    if (options.hash.table) {
      tableKey = options.hash.table + '_' + key;

      if (__t.polyglot.has(tableKey)) {
        value = __t(tableKey, options.hash);
      }
    }

    // NOTE: value can also be a HandleBars safe string
    return _.isString(value) ? app.capitalize(value) : value;
  });

  Handlebars.registerHelper('tVarCapitalize', function (key, options) {
    for (var index in options.hash) {
      if (!options.hash.hasOwnProperty(index)) {
        continue;
      }

      options.hash[index] = app.capitalize(options.hash[index]);
    }

    return __t(key, options.hash);
  });

  Handlebars.registerHelper('ascii', function (string, options) {
    return StringHelper.ascii(string);
  });

  //Raw handlebars data, helpful with data types
  Handlebars.registerHelper('raw', function (data) {
    return data && new Handlebars.SafeString(data);
  });

  Handlebars.registerHelper('number', function (number) {
    return number === undefined ? '' : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  });

  Handlebars.registerHelper('resource', function (name) {
    return app.RESOURCES_URL + name;
  });

  Handlebars.registerHelper('capitalize', function (string) {
    return app.capitalize(string);
  });

  Handlebars.registerHelper('nl2br', function (string) {
    return (string + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  });

  Handlebars.registerHelper('uppercase', function (string) {
    return (string || '').toUpperCase();
  });

  Handlebars.registerHelper('bytesToSize', function (bytes) {
    return app.bytesToSize(bytes, 0);
  });

  Handlebars.registerHelper('contextualDate', function (date, options) {
    if (date === undefined || date === null) {
      return '-';
    }

    return moment(date).timeAgo(options.hash.type);
  });

  Handlebars.registerHelper('fullDateTime', function (date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss Z');
  });

  Handlebars.registerHelper('formatDate', function (date, format) {
    return moment(date).format(format);
  });

  Handlebars.registerHelper('friendlyDateTime', function (date) {
    return moment(date).format('dddd, MMM DD, h:mm A');
  });

  Handlebars.registerHelper('readableBytesSize', function (bytes) {
    return FileHelper.readableBytes(bytes, 0);
  });

  Handlebars.registerHelper('avatarSmall', function (userId) {
    var user = app.users.get(userId);
    return '<img src="' + user.getAvatar() + '" style="margin-right:7px;" class="avatar">' + user.get('first_name');
  });

  // Get the model status name
  Handlebars.registerHelper('statusName', function (model) {
    return model.getStatusName();
  });

  Handlebars.registerHelper('statusBackgroundColor', function (model) {
    // StatusHelper.getBackgroundColorByModel
    return model.getStatusBackgroundColor();
  });

  Handlebars.registerHelper('statusTextColor', function (model) {
    return model.getStatusTextColor() || '#999999';
  });

  // Get the model status color
  Handlebars.registerHelper('statusColor', function (model) {
    return model.getStatusBackgroundColor() || '#eeeeee';
  });

  Handlebars.registerHelper('ifShowStatusBadge', function (model, options) {
    var status;
    var canShowBadge = false;

    // check if the table actually has
    if (model && model.table.hasStatusColumn()) {
      status = model ? model.getStatus() : null;
      canShowBadge = status ? status.get('show_listing_badge') : false;
    }

    if (!canShowBadge) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  Handlebars.registerHelper('notPublishedClass', function (model) {
    return model.isSubduedInListing() ? 'not-published' : '';
  });

  // Should be combined with userShort below with param: "show_avatar" [true,false]
  Handlebars.registerHelper('userName', function (userId) {
    if (_.isNaN(userId)) return;
    var user = app.users.get(userId);
    var firstName = user.get('first_name').toLowerCase();
    var lastNameFirstCharacter = user.get('last_name').toLowerCase().charAt(0);
    var nickName = firstName;
    var hit = app.users.find(function (model) {
      return model.get('first_name').toLowerCase() === firstName && model.id !== userId;
    });
    if (hit !== undefined) {
      nickName = firstName + ' ' + lastNameFirstCharacter + '.';
      hit = app.users.find(function (model) { return model.get('first_name').toLowerCase() === firstName && model.get('last_name').toLowerCase().charAt(0) === lastNameFirstCharacter && model.id !== userId; });
      if (hit !== undefined) {
        nickName = firstName + ' ' + user.get('last_name');
      }
    }
    return new Handlebars.SafeString(app.capitalize(nickName," "));
  });

  Handlebars.registerHelper('userShort', function (userId) {
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

  Handlebars.registerHelper('userAvatarUrl', function (userId) {
    return app.users.get(userId).getAvatar();
  });

  Handlebars.registerHelper('userAvatar', function (userId) {
    var user = app.users.get(userId);
    var avatar = user.getAvatar();

    return new Handlebars.SafeString('<img src="'+avatar+'" class="avatar" title="'+user.get('first_name')+' '+user.get('last_name')+'"/>');
  });

  Handlebars.registerHelper('userFull', function (userId) {
    var user = app.users.get(userId);
    return new Handlebars.SafeString('<img src="'+user.getAvatar()+'"  class="avatar"/><span class="name">'+user.get('first_name')+' '+user.get('last_name')+'</span>');
  });

  var userFirstAndLastName = function (userId) {
    var user = app.users.get(userId);

    return new Handlebars.SafeString(user.get('first_name')+' '+user.get('last_name'));
  };
  Handlebars.registerHelper('userFirstAndLastName', userFirstAndLastName);

  Handlebars.registerHelper('usersFirstAndLastName', function (userIds) {
    if (!_.isArray(userIds)) {
      return;
    }

    var result = [];
    _.each(userIds, function(userId, index) {
      // TODO: Clean this?
      var user = '<a href="#" class="js-user" data-id="' + userId + '">' + userFirstAndLastName(userId) + '</a>';
      var prefix = ', ';

      if (userIds.length > 1 && userIds.length === (index + 1)) {
        prefix = ' and ';
      } else if (index === 0) {
        prefix = '';
      }

      result.push(prefix + user);
    });

    return new Handlebars.SafeString(result.join(''));
  });

  Handlebars.registerHelper('directusTable', function (data) {

    if (data === undefined || !data.length) return;

    var headers = _.keys(data[0]);

    var headersTH = _.map(headers, function(header) { return '<th>' + app.capitalize(header, '_') + '</th>'; });

    var tHead = '<thead><tr>' + headersTH.join('') + '</tr></thead>';

    var tableRows = _.map(data, function (row) {
      //wrap values in td
      var values = _.values(row);
      var tds = _.map(values, function(value) { return '<td>' + value + '</td>'; });
      return '<tr>' + tds.join('') + '</tr>';
    });

    var tBody = '<tbody>' + tableRows.join('') + '</tbody>';

    var table = '<table class="table table-striped directus-table">' + tHead + tBody + '</table>';

    return new Handlebars.SafeString(table);
  });

  Handlebars.registerHelper('directusTable', function (data) {

    if (data === undefined || !data.length) return;

    var headers = _.keys(data[0]);

    var headersTH = _.map(headers, function (header) { return '<th>' + app.capitalize(header, '_') + '</th>'; });

    var tHead = '<thead><tr>' + headersTH.join('') + '</tr></thead>';

    var tableRows = _.map(data, function (row) {
      //wrap values in td
      var values = _.values(row);
      var tds = _.map(values, function (value) { return '<td>' + value + '</td>'; });
      return '<tr>' + tds.join('') + '</tr>';
    });

    var tBody = '<tbody>' + tableRows.join('') + '</tbody>';

    var table = '<table class="table table-striped directus-table">' + tHead + tBody + '</table>';

    return new Handlebars.SafeString(table);
  });

  Handlebars.registerHelper('directusSelect', function (data) {
    if (data === undefined) return;

    var name = data.name;
    data = data.options;

    var options = _.map(data, function (item) {
      var selected = item.selected ? 'selected' : '';
      return '<option value="' + item.name + '" ' + selected + '>' + item.title + '</option>';
    });

    var select = '<select id="' + name + '">' + options.join('') + '</select>';

    return new Handlebars.SafeString(select);
  });

  // Handlebars UI helper!
  function uiHelper(model, attr, options) {
    var column;
    var html;

    if (model.structure) {
      column = model.structure.get(attr)
    }

    if (column && (column.isOneToMany() || column.isManyToMany())) {
      var count = model.get(attr).length;
      var what = 'item';
      var type = 'multiple';

      if (column.getRelatedTableName() === 'directus_files') {
        what = 'file';
      }

      if (count === 1) {
        type = 'single';
      }

      html = __t('relational_count_x_' + what + '_' + type, {count: count});
    } else {
      if (model.isNested) {
        model = model.get('data');
      }

      html = UIManager.getList(model, attr) || '<span class="no-value">--</span>';
    }

    return new Handlebars.SafeString(html);
  }

  Handlebars.registerHelper('ui', uiHelper);

  Handlebars.registerHelper('uiView', function (model, column, options, parent) {
    var view = UIManager.getInputInstance(model, column, options);

    if (model.addInput) {
      model.addInput(column.id, view);
    }

    view.render();

    parent.setView('.' + column, view);
  });

  Handlebars.registerHelper('uiCapitalize', function (model, attr, options) {
    var value = uiHelper(model, attr, options);

    if (_.isString(value)) {
      value = app.capitalize(value);
    }

    return value;
  });

  Handlebars.registerHelper('ucase', function (string) {
    return (string || '').toUpperCase();
  });

  Handlebars.registerHelper('lcase', function (string) {
    return (string || '').toLowerCase();
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
  Handlebars.registerPartial('listingEmpty', function () {
    return '<div class="no-items"> \
      <div class="background-circle"> \
      <img src="{{assetsPath}}/imgs/no-items.svg"> \
      </div> \
      <br> \
      {{t "listing_items_not_found"}} \
    </div>';
  });
});
