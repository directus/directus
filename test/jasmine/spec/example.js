describe("one tautology", function() {
  it("is a tautology", function() {
    expect(true).toBeTruthy();
  });

  describe("is awesome", function() {
    it("is awesome", function() {
      expect(1).toBe(1);
    });
  });
});

describe("simple tests", function() {
  it("increments", function() {
    var mike = 0;

    expect(mike++ === 0).toBeTruthy();
    expect(mike === 1).toBeTruthy();
  });

  it("increments (improved)", function() {
    var mike = 0;

    expect(mike++).toBe(0);
    expect(mike).toBe(1);
  });
});

describe("setUp/tearDown", function() {
  beforeEach(function() {
    // console.log("Before");
  });

  afterEach(function() {
    // console.log("After");
  });

  it("example", function() {
    // console.log("During");
  });

  describe("setUp/tearDown", function() {
    beforeEach(function() {
      // console.log("Before2");
    });

    afterEach(function() {
      // console.log("After2");
    });

    it("example", function() {
      // console.log("During Nested");
    });
  });
});

describe("async", function() {
  it("multiple async", function() {
    var semaphore = 2;

    setTimeout(function() {
      expect(true).toBeTruthy();
      semaphore--;
    }, 500);

    setTimeout(function() {
      expect(true).toBeTruthy();
      semaphore--;
    }, 500);

    waitsFor(function() { return semaphore === 0 });
  });
});
