$(function() {
	//////////////////////////////////////////////////////////////////////////////
	// Toggle Permissions

	$('.permissions-workflow').on("click", function(e) {
		if(!$(this).hasClass('disabled')){
			$(this).parent().toggleClass('workflow-enabled');
		}
	});

	$('.required').on("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		if($(this).parent().hasClass('visibility-off')){
			return false;
		}
		if($(this).parent().hasClass('required-on')){
			$(this).find('.material-icons').text('star_outline');
			$(this).parent().removeClass('required-on');
		} else {
			$(this).find('.material-icons').text('star');
			$(this).parent().addClass('required-on');
		}
	});

	$('.visible').on("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		if($(this).parent().hasClass('visibility-off')){
			$(this).find('.material-icons').text('visibility');
			$(this).parent().removeClass('visibility-off');
		} else {
			$(this).find('.material-icons').text('visibility_off');
			$(this).parent().addClass('visibility-off');

			// Can't be required and hidden
			$(this).parent().find('.required .material-icons').text('star_outline');
			$(this).parent().removeClass('required-on');
		}
	});

	//////////////////////////////////////////////////////////////////////////////
	// Settings Videos

	$(".settings-module").hover(function () {
		$(this).find("video")[0].play();
	}, function () {
		var el = $(this).find("video")[0];
		el.pause();
		el.currentTime = 0;
	});

	//////////////////////////////////////////////////////////////////////////////
});