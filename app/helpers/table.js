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

  return {
    fixWidths: fixWidths
  }
});
