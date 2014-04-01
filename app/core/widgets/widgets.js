define([
  'core/widgets/PaginatorWidget',
  'core/widgets/PaginationCountWidget',
  'core/widgets/ButtonWidget',
  'core/widgets/SearchWidget',
  'core/widgets/SaveWidget',
  'core/widgets/VisibilityWidget',
  'core/widgets/FilterWidget',
  'core/widgets/SelectionActionWidget'
],

function(PaginatorWidget, PaginationCountWidget, ButtonWidget, SearchWidget, SaveWidget, VisibilityWidget, FilterWidget, SelectionActionWidget) {

  return {
    PaginatorWidget: PaginatorWidget,
    PaginationCountWidget: PaginationCountWidget,
    ButtonWidget: ButtonWidget,
    SearchWidget: SearchWidget,
    SaveWidget: SaveWidget,
    VisibilityWidget: VisibilityWidget,
    FilterWidget: FilterWidget,
    SelectionActionWidget: SelectionActionWidget
  };

});