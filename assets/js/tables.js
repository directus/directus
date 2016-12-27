//////////////////////////////////////////////////////////////////////////////
// Table Header & Footer

// Set widths for fixed header and footer cells
function tableColumnWidths() {
	$('.fixed-header tfoot tr td').each(function(index) {
		var width = $('tbody tr td:eq('+index+')').innerWidth();
		$(this).innerWidth(width);
	});
	$('.fixed-header thead tr th').each(function(index) {
		var width = $('tbody tr td:eq('+index+')').innerWidth();
		$(this).innerWidth(width);
	});
}

$(function() {

	//////////////////////////////////////////////////////////////////////////////
	// Table Header Shadow

	function headFootShadows() {
		var pageScrollTop = $('.page').scrollTop();
		var scrollBottom = $('table.fixed-header').height() - $('.page').height() - pageScrollTop + 64; // 64 is table padding
		var headScroll = Math.max(Math.min(pageScrollTop, 100), 0) / 100;
		$('table.fixed-header thead').css({ boxShadow: '0px 2px 6px 0px rgba(200,200,200,'+headScroll+')' });
		footScroll = Math.max(Math.min(scrollBottom, 100), 0) / 100;
		$('table.fixed-header tfoot').css({ boxShadow: '0px -2px 6px 0px rgba(200,200,200,'+footScroll+')' });

		// Position Sticky Header
		if($('table.fixed-header').hasClass('charted')) {
			//headerDelta = parseInt($('table.fixed-header thead').css('top'), 10);
			headerTop = Math.max(64, 304 - pageScrollTop); // 320 is tied to CSS/SASS (default top from charted)
			$('table.fixed-header thead').css('top', headerTop);
		}
	}

	$('.page').on('scroll', function(){
		headFootShadows();
	});

	$(window).load(function() {
		tableColumnWidths();
		headFootShadows();
	}).resize(function() {
		tableColumnWidths();
		headFootShadows();
		// resizeMessages(false, true);
	});

	//////////////////////////////////////////////////////////////////////////////
	// Remove Relational (table on edit page)

	$('.relational-remove').on("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
	});

	//////////////////////////////////////////////////////////////////////////////
	// Table Footer Toggle

	$('.footer-open-toggle').on("click", function(e) {
		$('tfoot').toggleClass('footer-open');
	});

	//////////////////////////////////////////////////////////////////////////////
	// Change table spacing

	$('.spacing-adjust').on("change", function(e) {
		$('table').removeClass('compact').removeClass('cozy').removeClass('comfortable').addClass($(this).val());
	});

	//////////////////////////////////////////////////////////////////////////////
	// Drag and Drop

	// Table Items
	dragula({
		isContainer: function (el) {
			return el.classList.contains('drag-and-drop');
		},
		moves: function (el, source, handle, sibling) {
			// return true; // elements are always draggable by default
			return handle.classList.contains('reorder-handle');
		},
		accepts: function (el, target, source, sibling) {
			return true; // elements can be dropped in any of the `containers` by default
		},
		invalid: function (el, handle) {
			return false; // don't prevent any drags from initiating by default
		},
		direction: 'vertical',             // Y axis is considered when determining where an element would be dropped
		copy: false,                       // elements are moved by default, not copied
		copySortSource: false,             // elements in copy-source containers can be reordered
		revertOnSpill: false,              // spilling will put the element back where it was dragged from, if this is true
		removeOnSpill: false,              // spilling will `.remove` the element, if this is true
		mirrorContainer: $('tbody.drag-and-drop')[0],    // set the element that gets mirror elements appended
		ignoreInputTextSelection: true     // allows users to select input text, see details below
	}).on('cloned', function (clone, original, type) {
		$(clone).find('td').each(function(index) {
			var width = $('tbody tr td:eq('+index+')').innerWidth();
			$(this).innerWidth(width);
		});
	}).on('drag', function (el) {
		// console.log("drag", el);
	}).on('drop', function (el) {
		// console.log("drop");
	});

	//////////////////////////////////////////////////////////////////////////////
	// Chart (example)

	if($('table.fixed-header').hasClass('charted')) {

		var pointRadius = 2,
			borderWidth = 2,
			dayWidth = 60,
			chartStore = [];

		var ctx = document.getElementById("chart");
		var myChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: ["JUL 30", "JUL 31", "AUG 1", "AUG 2", "AUG 3", "AUG 4", "AUG 5", "AUG 6", "AUG 7", "AUG 8", "AUG 9", "AUG 10", "AUG 11", "AUG 12", "AUG 13", "AUG 14", "AUG 15", "AUG 16", "AUG 17", "AUG 18", "AUG 19", "AUG 20", "AUG 21", "AUG 22", "AUG 23", "AUG 24", "AUG 25", "TODAY"],
				datasets: [{
					label: 'Views',
					showLine: true,
					data: [24,24,24,23,20,19,16,14,9,7,4,2,1,3, 24,24,24,23,20,19,16,14,9,7,4,10,17,19],
					pointRadius: pointRadius,
					fill: true,
					backgroundColor: 'rgba(52, 152, 219, 0.1)',
					borderWidth: borderWidth,
					pointBorderWidth: 2,
					pointBackgroundColor: '#3498DB',
					pointHoverBackgroundColor: '#3498DB',
					pointHitRadius: 5,
					pointHoverRadius: pointRadius + 2,
					borderColor: '#3498DB'
				}]
			},
			options: {
				defaultFontSize: 10,
				defaultFontFamily: 'Roboto',
				maintainAspectRatio: false,
				responsive: true,
				title: {
					display: false
				},
				legend: {
					display: false
				},
				tooltips: {
					enabled: true,
					mode: 'single',
					titleFontSize: 12,
					backgroundColor: '#333333',
					titleFontFamily: 'Roboto',
					titleFontColor: '#ffffff',
					bodyFontFamily: 'Roboto',
					bodyFontColor: '#ffffff',
					caretSize: 4,
					xPadding: 10,
					yPadding: 10
				},
				scales: {
					xAxes: [{
						display: true,
						ticks: {
							fontColor: '#9E9E9E',
							fontFamily: 'Roboto',
							fontStyle: '500',
							fontSize: 10,
							autoSkipPadding: 50,
							maxRotation: 0
						},
						gridLines: {
							color: '#EEEEEE',
							display: false,
							drawBorder: false
						}
					}],
					yAxes: [{
						//type: 'logarithmic', // Comment this out if things look funky (can't handle `0` in data)
						display: true,
						position: "left",
						ticks: {
							fontColor: '#9E9E9E', // #9E9E9E
							fontFamily: 'Roboto',
							fontStyle: '500',
							fontSize: 10,
							padding: 20,
							// labelOffset: 100
						},
						gridLines: {
							color: '#EEEEEE',
							drawBorder: false,
							display: true
						}
					}],
				}
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////
});