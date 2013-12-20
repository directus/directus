define(function(require) {

  "use strict";

  var TableModel = require("schema/TableModel");
  var userSchema = require("schema/fixed/users");

  describe("TableModel", function() {

    it("should exist", function() {
      expect(TableModel).to.exist;
      expect(new TableModel(userSchema)).to.be.an.instanceof(TableModel);
    });

  	describe('#columns', function(){
  	  var url = 'test/test';
  	  var model = new TableModel(userSchema, {url: url, parse: true});

      it('should exist', function() {
      	expect(model.columns).to.exist;
      	expect(model.columns).to.be.an.instanceof(Backbone.Collection);
      });

      it('should have a correct url', function() {
      	expect(model.columns.url).to.exist;
      	expect(model.columns.url).to.exist;
      	expect(model.columns.url).to.equal(url+'/columns');
      });

  	});

  	describe('#toJSON()', function(){
  	  var url = 'test/test';
  	  var model = new TableModel(userSchema, {url: url, parse: true});

      it('should include columns', function() {
      	expect(model.toJSON()).to.have.property('columns');
      });

  	});



  });

});
