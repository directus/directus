define(function(require) {

  "use strict";

  var DateTimeUI = require('core-ui/datetime'),
      SchemaManager = require("schema/SchemaManager"),
      EntriesModel = require("core/entries/EntriesModel"),
      moment = require('moment');

  var data = {
    "id": 1,
    "datetime_column": "Fri, 13 Dec 2013 19:26:00",
    "date_column": "Sun, 01 Dec 2011 00:00:00"
  }

  var d = moment(data.date_column);

  var table = SchemaManager.getTable('date_test');

  var dateTestModel = new EntriesModel(data, {
    structure: table.columns,
    table: table,
    parse: true
  });

  var options = {
    model: dateTestModel,
    name: 'datetime_column'
  }

  describe("core-ui/datetime", function() {

    var ui = new DateTimeUI.Input(options);

    ui.render();

    it("should contain a valid date", function() {
      expect(ui.$el).to.have('input[name=datetime_column]');
      expect(ui.$('input[name=datetime_column]').val()).to.be('2013-12-15 19:28');

      ui.$('input[type=date]').val('2010-10-01').change();
      ui.$('input[type=time]').val('00:10').change();

      console.log(ui.$('input[name=datetime_column]').val());

      console.log(DateTimeUI.validate(ui.$('input[name=datetime_column]').val()));
    });

  });

});
