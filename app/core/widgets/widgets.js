define([
  'core/widgets/PaginatorView',
  'core/widgets/ButtonWidget',
  'core/widgets/SearchWidget',
  'core/widgets/SaveWidget'
],

function(PaginatorView, ButtonWidget, SearchWidget, SaveWidget) {

  return {
    PaginatorWidget: PaginatorView,
    ButtonWidget: ButtonWidget,
    SearchWidget: SearchWidget,
    SaveWidget: SaveWidget
  };

});