define([
  'core/widgets/PaginatorWidget',
  'core/widgets/PaginationCountWidget',
  'core/widgets/ButtonWidget',
  'core/widgets/SearchWidget',
  'core/widgets/SaveWidget',
  'core/widgets/VisibilityWidget',
  'core/widgets/FilterWidget',
  'core/widgets/FilterButtonWidget',
  'core/widgets/SelectionActionWidget',
  'core/widgets/SelectedCountWidget'
],

function(PaginatorWidget, PaginationCountWidget, ButtonWidget, SearchWidget, SaveWidget, VisibilityWidget, FilterWidget, FilterButtonWidget, SelectionActionWidget, SelectedCountWidget) {

  return {
    PaginatorWidget: PaginatorWidget,
    PaginationCountWidget: PaginationCountWidget,
    ButtonWidget: ButtonWidget,
    SearchWidget: SearchWidget,
    SaveWidget: SaveWidget,
    VisibilityWidget: VisibilityWidget,
    FilterWidget: FilterWidget,
    FilterButtonWidget: FilterButtonWidget,
    SelectionActionWidget: SelectionActionWidget,
    SelectedCountWidget: SelectedCountWidget
  };

});
