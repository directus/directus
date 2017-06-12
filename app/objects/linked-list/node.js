define(['exports'], function (exports) {

  var Node = function (id, value) {
    this.id = id;
    this.value = value;
    this.next = null;
  };

  Node.prototype.getValue = function () {
    return this.value;
  };

  return Node;
});
