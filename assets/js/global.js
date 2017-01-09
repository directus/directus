$(function() {

	$('.close-preview-intro').on("click", function(e) {
		$(this).parent().fadeOut(200);
	});

	//////////////////////////////////////////////////////////////////////////////
	// Spotlight

	function spotlight(el) {
		var target = el.offset(),
			targetWidth = el.width(),
			targetHeight = el.height(),
			targetDimension = Math.max(targetWidth, targetHeight, 100) * 1.2, // Min = 100
			windowLeft = $(window).scrollLeft(),
			windowTop = $(window).scrollTop(),
			left = Math.round(target.left - windowLeft),
			top = Math.round(target.top - windowTop),
			spot = 100, // Size of spot
			mask = 5000, // Size of svg
			dimension = (targetDimension / spot) * mask,
			position = {
				top: -(dimension / 2),
				left: -(dimension / 2)
			};

			position.left = position.left + left + (targetWidth / 2);
			position.top = position.top + top + (targetHeight / 2);

		$('.discover-spotlight').css({
			'left' : position.left,
			'top' : position.top,
			'width' : dimension,
			'height' : dimension
		});
	}

	$(document).on("click", "body.help .help", function(e) {
		e.preventDefault();
		e.stopPropagation();
		spotlight($(this));

		$('.discover-description').text($(this).data('help'));
		return false;
	});

	$('.discover-close').on("click", function(e) {
		$('.discover #check-discover').prop('checked', false).change();
	});

	$('.discover #check-discover').on('change', function() {
		if($(this).prop('checked')){
			$('.discover-description').text('Click on things to learn more about them');
			$('body').addClass('help');
		} else {
			$('body').removeClass('help');
		}
	});

	//////////////////////////////////////////////////////////////////////////////
	// User Modals

	// $(document).keyup(function(e) {
	// 	if (e.keyCode == 27) { // escape key = 27
	// 		closeSmoke();
	// 	}
	// });

	// Close overlays when clicking "outside"
	// $('.smoke').on("click", function(e) {
	// 	closeSmoke();
	// });

	// Don't close when clicking inside the modal modal
	// $('.modal-bg').on("click", function(e) {
	// 	e.stopPropagation();
	// });

	// $('.modal .close-modal').on("click", function(e) {
	// 	closeSmoke();
	// });

	// function closeSmoke() {
	// 	$('.smoke .modal.active').removeClass('active').addClass('slide-down');
	// 	setTimeout(function(){
	// 		$('.smoke .slide-down').removeClass('slide-down');
	// 	}, 200);
	// 	$('.smoke').fadeOut(200);
	// }

	// Route overlay requests
	var modal;
	$('.open-modal').on("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		modal = $(this).data('modal');
		if($('.smoke').is(":visible")){
			$('.smoke .modal.active').removeClass('active').addClass('slide-down');
			setTimeout(function(){
				$('.smoke').fadeIn(200);
				$('.smoke .slide-down').removeClass('slide-down');
				$('.smoke .'+modal).addClass('active');
			}, 200);
		} else {
			$('.smoke').fadeIn(200);
			$('.smoke .'+modal).addClass('active');
		}
	});

	//////////////////////////////////////////////////////////////////////////////
	// Dynamic Links

	$('.dynamic-link').on("click", function(e) {
		window.location.href = $(this).data('dynamic-link');
	});

	$('tbody .reorder, tbody .status').on("click", function(e) {
		event.stopPropagation();
	});

	//////////////////////////////////////////////////////////////////////////////
});
