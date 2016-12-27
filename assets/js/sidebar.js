$(function() {
	//////////////////////////////////////////////////////////////////////////////
	// Avatar Menu (Hover Open)

	var avatarMenuTimer = false;

	$('.sidebar .user-menu-toggle').mouseenter(function(event) {
		clearTimeout(avatarMenuTimer);
		$('.user-menu').addClass('active');
	}).mouseleave(function(event) {
		clearTimeout(avatarMenuTimer);
		avatarMenuTimer = setTimeout(closeAvatarMenu, 500);
	});

	function closeAvatarMenu() {
		clearTimeout(avatarMenuTimer);
		$('.user-menu').removeClass('active');
	}

	//////////////////////////////////////////////////////////////////////////////
	// Table Sidebar Toggle

	function toggleRightSidebar() {
		if($('.right-sidebar').hasClass('wide')){
			$('body').toggleClass('right-sidebar-open-wide');
		} else {
			$('body').toggleClass('right-sidebar-open');
		}
		setTimeout(tableColumnWidths, 250);
	}
	$('.right-sidebar-toggle, .right-sidebar .close').on("click", function(e) {
		toggleRightSidebar();
	});

	if($('.right-sidebar').hasClass('sidebar-open')) {
		toggleRightSidebar();
	}

	//////////////////////////////////////////////////////////////////////////////
	// Right Sidebar Columns

	dragula({
		isContainer: function (el) {
			return el.classList.contains('reorder-columns');
		},
		moves: function (el, source, handle, sibling) {
			return true; // elements are always draggable by default
			// return handle.classList.contains('reorder-handle');
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
		mirrorContainer: $('.reorder-columns')[0],    // set the element that gets mirror elements appended
		ignoreInputTextSelection: true     // allows users to select input text, see details below
	});

	//////////////////////////////////////////////////////////////////////////////
	// Activity Full

	$('.activity-full-toggle').on("click", function(e) {
		if($(this).parent().hasClass('expanded')){
			$('.activity').removeClass('expanded');
		} else {
			$('.activity').removeClass('expanded');
			$(this).parent().addClass('expanded');
		}
	});

	//////////////////////////////////////////////////////////////////////////////
});