define([], function () {

  // links replacer
  function linksReplacer(match, p1, p2, p3, offset, string) {
    var url = p1;
    var text = p3 || url;

    return '<a href="' + url + '" target="_blank">' + text + '</a>';
  }

  return {
    ascii: function (string) {
      return (string || '').split('').map(function (char) {
        return char.charCodeAt(0).toString(16);
      }).join('');
    },
    nl2br: function (string) {
      // add new lines
      return (string || '').replace(/[\r\n]/g, '<br>');
    },

    url: function (string) {
      // links
      return (string || '').replace(/%\[(.*)\](\((.*)\))?/, linksReplacer);
    },

    parse: function (string) {
      string = this.nl2br(string);

      return this.url(string);
    }
  }
});
