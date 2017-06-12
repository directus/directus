define(['underscore', './node', 'exports'], function (_, Node, exports) {

  'use strict';

  var Circular = function (items) {
    if (!_.isArray(items)) {
      items = [items];
    }

    this.size = 0;
    this.headNode = this.currentNode = null;

    if (items) {
      this.init(items);
    }
  };

  Circular.prototype.init = function (items) {
    items.forEach(function (item) {
      this.push(item);
    }, this);
  };

  Circular.prototype.get = function (id) {
    var current = this.headNode;

    while (current.next !== this.headNode) {
      if (current.id === id) {
        break;
      } else {
        current = current.next;
      }
    }

    return current.id === id ? current : null;
  };

  Circular.prototype.push = function (value) {
    var node = new Node(this.size, value);

    this.size++;
    if (this.headNode === null) {
      this.headNode = this.currentNode = node;
      node.next = this.headNode;
    } else {
      var last = this.headNode;
      for (var i = 0; i < this.size; i++) {
        last = last.next;
      }

      last.next = node;
      node.next = this.headNode;
    }
  };

  Circular.prototype.current = function () {
    return this.currentNode;
  };

  Circular.prototype.next = function () {
    this.currentNode = this.current().next;

    return this.current();
  };

  return Circular;
});
