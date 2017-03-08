define(function () {

  // Fix table columns width dynamically
  var fixWidths = function ($table) {
    $table.find('tfoot tr td').each(function (index) {
      var width = $table.find('tbody tr td:eq('+index+')').innerWidth();
      $(this).innerWidth(width);
    });

    $table.find('thead tr th').each(function (index) {
      var width = $table.find('tbody tr td:eq('+index+')').innerWidth();
      $(this).innerWidth(width);
    });
  };

  var headerScroll = function ($el) {
    var tableLeft = $el.scrollLeft();
    var tableWidth = $el.children('table').width();
    var containerWidth = $el.width();
    var pageLeft = parseInt($('.page').css('left'), 10);
    $el.find('thead').css({
      'left': pageLeft - tableLeft,
      'right': -((tableWidth - containerWidth) - tableLeft)
    });
  };

  return {
    fixWidths: fixWidths,
    headerScroll: headerScroll
  }
});
