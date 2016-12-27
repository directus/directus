$(function() {

	//////////////////////////////////////////////////////////////////////////////
	// Files and Folders

	dragula([document.getElementById('file-listing')], {
		isContainer: function (el) {
			return el.classList.contains('folder');
		},
		moves: function (el, source, handle, sibling) {
			// console.log(el, source, handle, sibling);
			if($(el).parent().hasClass('folder')){
				return false;
			}
			return true; // elements are always draggable by default
			// return handle.classList.contains('reorder-handle');
		},
		accepts: function (el, target, source, sibling) {
			// console.log(el, target, source, sibling);
			return true; // elements can be dropped in any of the `containers` by default
		},
		invalid: function (el, handle) {
			// return false; // don't prevent any drags from initiating by default
			return el.classList.contains('folder');
		},
		copy: true,                       // elements are moved by default, not copied
		copySortSource: false,             // elements in copy-source containers can be reordered
		revertOnSpill: true,              // spilling will put the element back where it was dragged from, if this is true
		removeOnSpill: false,              // spilling will `.remove` the element, if this is true
		mirrorContainer: $('.file-listing')[0],    // set the element that gets mirror elements appended
		ignoreInputTextSelection: true     // allows users to select input text, see details below
	}).on('drag', function (el, source) {
		console.log("drag", el, source);
	}).on('drop', function (el, target, source, sibling) {
		console.log("drop", el, target, source, sibling);
		$('.file.moving').addClass('deleted');
	}).on('cancel', function (el, container, source) {
		console.log("cancel", el, container, source);
		$('.file').removeClass('moving');
	}).on('over', function (el, container, source) {
		// console.log("over", el, container, source);
		if ($(container).hasClass('folder')) {
			$(container).addClass('into-folder');
		}
	}).on('out', function (el, container, source) {
		// console.log("out", el, container, source);
		if ($(container).hasClass('folder')) {
			$(container).removeClass('into-folder');
		}
	}).on('cloned', function (clone, original, type) {
		// console.log("clone", clone, original, type);
		$(original).addClass('moving');
	});

	//////////////////////////////////////////////////////////////////////////////
	// Messages

	$('.message-preview').on("click", function(e) {
		$('.message-preview').removeClass('active');
		$(this).addClass('active').removeClass('unread');
	});

	$('.reply textarea').on("focus", function(e) {
		$('.reply').addClass('active');
	}).on("blur", function(e) {
		if(!$(this).val()){
			$('.reply').removeClass('active');
		}
	});

	// Drag and drop column resizing
	var isResizing = false,
		lastDownX = $('.resize-left').css('width');

	$('.resize-handle').on('mousedown', function (e) {
		e.preventDefault();
		isResizing = true;
		lastDownX = e.clientX;
	});

	function resizeMessages(e, force) {
		if (!isResizing && !force) {
			return;
		}

		e.preventDefault();

		var offsetLeft = (force)? parseInt($('.resize-left').css('width'), 10) : e.clientX - $('.page').offset().left;
		offsetLeft = Math.max(offsetLeft, parseInt($('.resize-left').css('min-width'), 10));

		var widthRight = $('.page').width() - offsetLeft;
		if(widthRight <= parseInt($('.resize-right').css('min-width'), 10)){
			widthRight = parseInt($('.resize-right').css('min-width'), 10);
			offsetLeft = $('.page').width() - widthRight;
		}

		// Convert to percentages
		offsetLeftPercent = (offsetLeft / $('.page').width()) * 100;
		widthRightPercent = (widthRight / $('.page').width()) * 100;

		$('.resize-left').css('width', offsetLeftPercent+'%');
		$('.resize-right').css('left', offsetLeftPercent+'%').css('width', widthRightPercent+'%');
	}
	// resizeMessages(false, true);

	$(document).on('mousemove', function (e) {
		resizeMessages(e, false);
	}).on('mouseup', function (e) {
		isResizing = false;
	});

	//////////////////////////////////////////////////////////////////////////////
});