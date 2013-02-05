test("one tautology", function() {
  ok(true);
});

module("simple tests");

test("increments", function() {
  var mike = 0;

  ok(mike++ === 0);
  ok(mike === 1);
});

test("increments (improved)", function() {
  var mike = 0;

  equal(mike++, 0);
  equal(mike, 1);
});


module("setUp/tearDown", {
  setup: function() {
    //console.log("Before");
  },

  teardown: function() {
    //console.log("After");
  }
});

test("example", function() {
  //console.log("During");
});

module("async");

test("multiple async", function() {
  expect(2);

  stop();

  setTimeout( function( ) {
    ok(true, "async operation completed");
    start();
  }, 500);

  stop();

  setTimeout(function() {
    ok(true, "async operation completed");
    start();
  }, 500);
});
