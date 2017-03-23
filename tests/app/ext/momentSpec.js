define(['ext/moment-timeago'], function (moment) {

  describe('Moment TimeAgo', function() {
    it('should return same as fromNow', function () {
      expect(moment().timeAgo()).toBe(moment().fromNow());
      expect(moment().add({d: 5}).timeAgo()).toBe(moment().add({d: 5}).fromNow());

      expect(moment().timeAgo('large')).toBe(moment().fromNow());
      expect(moment().add({d: 5}).timeAgo('large')).toBe(moment().add({d: 5}).fromNow());
    });

    it('should return new format', function () {
      // now
      expect(moment().timeAgo('small')).toBe('now');
      expect(moment().timeAgo('medium')).toBe('just now');

      // minutes
      expect(moment().add({m: 2}).timeAgo('small')).toBe('2m');
      expect(moment().add({m: 2}).timeAgo('medium')).toBe('2m ago');

      // hours
      expect(moment().add({h: 3}).timeAgo('small')).toBe('3h');
      expect(moment().add({h: 3}).timeAgo('medium')).toBe('3h ago');

      // days
      expect(moment().add({d: 3}).timeAgo('small')).toBe('3d');
      expect(moment().add({d: 3}).timeAgo('medium')).toBe('3d ago');

      // weeks
      expect(moment().add({d: 8}).timeAgo('small')).toBe('1w');
      expect(moment().add({d: 8}).timeAgo('medium')).toBe('1w ago');

      // months as weeks
      expect(moment().add({M: 1}).timeAgo('small')).toBe('4w');
      expect(moment().add({M: 1}).timeAgo('medium')).toBe('4w ago');

      // years
      expect(moment().add({y: 2}).timeAgo('small')).toBe('2y');
      expect(moment().add({y: 2}).timeAgo('medium')).toBe('2y ago');
    });
  });
});
