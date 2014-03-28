define([
  'core/widgets/PaginatorView',
  'core/widgets/bookmarkWidget',
  'core/widgets/buttonWidget',
  'core/widgets/searchWidget',
  'core/widgets/saveWidget'
],

function(PaginatorView, bookmarkWidget, buttonWidget, searchWidget, saveWidget) {

  return {
    paginator: PaginatorView,
    BookmarkWidget: bookmarkWidget,
    ButtonWidget: buttonWidget,
    SearchWidget: searchWidget,
    SaveWidget: saveWidget
  };

});