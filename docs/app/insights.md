# Insights

> Insights is a Module in Directus that allows rapid, no-code buildout of analytics dashboards. Regardless of your
> use-case _(be it business intelligence, user progress tracking, web traffic conversions, or whatever!)_ you will be
> able to setup key data metrics in just a few clicks.

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/insights-dashboards-20220216A.mp4" type="video/mp4" />
</video>

[[toc]]

## How it Works

First, create a Dashboard, then fill the Dashboard with Panels. Each Panel provides some unique type of analytics
insight.

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/insights-how-it-works-20220216A_1.mp4" type="video/mp4" />
</video>

1. Click the "Create Dashboard" action button <span mi btn >add</span> in the page header.
2. Fill in the dashboard name, icon and note.
3. Click "Save".
4. Click the edit icon in the page header.
5. Hit the "Create Panel" <span mi btn >add</span> in the page header.
6. Select a Panel type. [Learn More about panel types.](#panels-overview)
7. Adjust the Panel Options to customize the analytics metric.

## Dashboards Overview

Each Directus Dashboard provides a drag-and-drop canvas where you can create and arrange different Panels to easily
build out customized analytics. The Dashboard area automatically expands as you add more and more Panels. In theory, a
Dashboard area can expand infinitely large... but in practice, users will probably only want to build Dashboards as
large as the screen they will be viewing on. You are able to create as many Dashboards as you need. Additionally, the
Dashboard view, edit, and create permissions are [fully configurable](/configuration/users-roles-permissions/) by User
Role.

![Dashboard Grid Area](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/dashboards-overview-20220216A.webp)

## Create, Edit, and Delete Dashboards

![How to Add, Edit and Delete Dashboards in Directus Insights](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/create-edit-delete-dashboards-20220216A.webp)

1. Click the <span mi btn >add</span> icon in the page header to create a new Dashboard.
2. Click the item option to edit or delete a Dashboard.

## Panels Overview

Panels are the building-blocks we add onto Insights dashboards to create, save and display data analytics. There are 4
types of Panels.

![Directus Dashboard Panels](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/panels-overview-20220216A.webp)

1. **Label** – Displays simple header text to describe other groups of panels. Doesn't actually provide data analysis.
2. **List** – Sortable, filterable list of items within a collection.
3. **Metric** – Sortable, filterable single-number metrics like sum, average, minimum and maximum, or first and last.
4. **Time Series** – Graph to display how metrics change over time. Provides same sorting, filtering and aggregation
   features seen in the list and metric panels.

## Panel Header Options

All 4 panel types let you set custom text to provide quick and clear context about what a Panel represents. Panel Header
options are exactly the same for all four Panel types. Headers are also totally optional and can be hidden.

![Panel Header Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/panel-header-options-20220216A.webp)

- **Visible** – Determines if the header is visible or not.
- **Name** – Sets a name in the header area.
- **Icon** – Sets a small icon by the name.
- **Color** – Sets a color for the icon.
- **Note** – Sets a short description of the icon.

## Labels

As the name implies, this panel simply allows you to _label_ a group of other panels. Labels do not provide analytics.
Labels simply help visually group the other panels (_which do provide analytics_) and give context to your dashboard.

### Label Panel Options

![Label Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/label-panel-options-20220216A.webp)

- **Label** – Sets the label text.
- **Color** – Sets the label text color.

## Lists

List panels display some number of Items from a Collection, _as a list!_ These Items displayed can be filtered by other
criteria as well. So for example, you could show your top 5 selling products, 3 worst performing sales regions, 10
students with the highest GPA _that are also_ in intramural sports, or create any other kind of ranked and/or filtered
list that could be generated from your dataset.

### List Panel Options

![List Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/list-panel-options-20220216A.webp)

- **Collection** – Selects the Collection to rank.
- **Limit** – Limits the number of Items that will appear in the Dashboard.
- **Sort Field** – Sets the Collection Field you wish to order results by.
- **Sort Direction** – Sets Items to display in ascending or descending order.
- **Display Template** – Defines how List Items will be represented. Allows use of Field Item values as well as custom
  text.
- **Filter** – Sets filters to only consider and rank Items that meet some criteria.

## Metrics

Metrics Panels allow you to aggregate all Items in a Field down to a single value.

### Metrics Panel Options

![Metrics Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/metric-panel-options-20220216A.webp)

- **Collection** – Selects the Collection.
- **Field** – Selects the Field to run aggregate function on.
- **Aggregate Function** – Selects the type of aggregate to perform.
- **Sort Field** – Sets the collection field you wish to order results by.
- **Filter** – Sets filters to only run metrics on Items that meet some criteria.

### More on Aggregate Functions

Generally speaking, aggregate functions take a list of values and returns one single value.

- **Count** – Counts the number of Items in a Field.
- **Count (Distinct)** – Counts the number of _unique_ Items in a field.
- **Average** – Averages values of all Items in a Field.
- **Average (Distinct)** – Averages values of all _unique_ Items in a Field.
- **Sum** – Sums the values of all Items in a Field.
- **Sum (Distinct)** – Sums the values of all _unique_ Items in a Field.
- **Minimum** – Selects the lowest valued Item in a Field.
- **Maximum** – Selects the highest valued Item in a Field.
- **First** – Selects the first Item out of all Items in a Field.
- **Last** – Selects the last Item out of all Items in a Field.

::: tip First, Last, Minimum and Maximum

First, Last, Minimum and Maximum are not aggregates in the purely mathematical sense of the word. However, they are
placed in this panel option because they return one single Item.

:::

::: tip Why are some Fields grayed out?

Certain Fields cannot be used with certain aggregate functions. For example, you cannot use the average function on
Fields that store text, because text cannot be averaged. When there is a conflict between panel options, Fields will be
grayed out and unselectable in the `field dropdown list`.

:::

### Style and Format Options

- **Abbreviate Value** – Abbreviates large numbers with a letter _(e.g. 2,000 = 2k)_.
- **Decimals** – Changes the number of decimals displayed.
- **Prefix** – Adds text before the aggregate metric.
- **Suffix** – Adds text after the aggregate metric.
- **Conditional Styles** – Changes color of number displayed if it is `>`, `>=`, `<`, `<=`, `==`, or `!=` to some
  defined value.

## Time Series

The Time Series Panel allows you to build graphs and see how data changes over time.

::: warning Time-oriented metrics only

In order to use this Panel, your Collection will need a datetime Field.

:::

![Time Series Panel Options](https://cdn.directus.io/docs/v9/app-guide/insights/insights-20220216A/time-series-panel-options-20220216A.webp)

- **Collection** – Selects the Collection you want to analyze.
- **Color** – Sets color of your graph curve.
- **Group Aggregation** – Selects the type of aggregation to perform. [Learn more.](#more-on-aggregate-functions)
- **Group Precision** – Sets the time interval to aggregate by _(days, weeks, months, etc.)_.
- **Date Field** – Selects the datetime Field used along the x-axis.
- **Date Range** – Sets the time range from which data should be displayed, can be customized.
- **Value Field** – Sets the Field you wish to aggregate.
- **Value Decimals** – Changes the number of decimals displayed on the y-axis.
- **Min Value** – Sets minimum value displayed on y-axis.
- **Max Value** – Sets maximum value displayed on y-axis.
- **Curve Type** – Sets curve to be shown as smooth, straight or stepline.
- **Fill Type** – Sets fill type under curve to gradient, solid, or none.
- **Filter** – Allows filtering of Items considered for analysis based on logical conditions.
- **Show X-axis** – Toggles display of time along X-axis.
- **Show Y-axis** – Toggles display of numeric values along Y-axis.

:::tip Custom Date Range

Note that `Past` is not prefixed to a custom range as it is on the default ranges. When selecting **"Other"**, simply
type in `3 years`, `1 month`, `2 weeks`, `5 days`, etc.

:::

## Extensibility Options

Teams that need highly advanced or specialized analytics options are able to extend, customize and modify this module as
needed. Here are some great resources to get started down that track.

- [Extensions > Modules](/extensions/modules)
- [Extentions > Panels](/extensions/panels)
