define(['objects/linked-list/circular'], function (Circular) {
  describe('Circular linked list tests', function () {
    it('should has the correct values', function () {
      var circular = new Circular([1, 2, 3]);
      var head = circular.headNode;

      expect(head.value).toBe(1);
      expect(head.next.value).toBe(2);
      expect(head.next.next.value).toBe(3);
      expect(head.next.next.next).toBe(head);
    });

    it('should work with next', function () {
      var circular = new Circular([1, 2, 3]);
      var head = circular.current();

      expect(head.value).toBe(1);
      expect(circular.next().value).toBe(2);
      expect(circular.next().value).toBe(3);
      expect(circular.next()).toBe(head);
    });

    it('should find id', function () {
      var circular = new Circular([1, 2, 3]);

      expect(circular.get(0).value).toBe(1);
      expect(circular.get(1).value).toBe(2);
      expect(circular.get(2).value).toBe(3);
      expect(circular.get(3)).toBe(null);
    });
  });
});
