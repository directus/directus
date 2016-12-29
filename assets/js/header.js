$(function() {

	//////////////////////////////////////////////////////////////////////////////
	// Hamburger Toggle

	$('.header .breadcrumb .hamburger').on("click", function(e) {
		$('body').toggleClass('sidebar-open');
	});

	//////////////////////////////////////////////////////////////////////////////
	// Filter Dropdown Toggle

	$('.filter-dropdown-toggle').on("click", function(e) {
		$('.filter').toggleClass('filter-dropdown-open');
		// if($('.filter').hasClass('filter-dropdown-open')){
		// 	$(this).html('arrow_drop_up');
		// } else {
		//	$(this).html('arrow_drop_down');
		// }
	});

	//////////////////////////////////////////////////////////////////////////////
	// Bulk Status, Delete, and Edit

	$('.bulk-selectable .select-row').change(function() {
		var selectCount = $('.bulk-selectable .select-row:checked').length;

		$('.bulk-selectable .select-row:not(:checked)').parents('tr').removeClass('selected');
		$('.bulk-selectable .select-row:checked').parents('tr').addClass('selected');

		if(selectCount >= 1) {
			$('#bulkDelete').show();
			$('#bulkStatus').show();
			$('.filter').hide();
		} else {
			$('#bulkDelete').hide();
			$('#bulkStatus').hide();
			$('.filter').show();
		}
		if(selectCount >= 2) {
			$('#bulkEdit').show();
			$('#bulkStatus').addClass('bulkEdit');
		} else {
			$('#bulkEdit').hide();
			$('#bulkStatus').removeClass('bulkEdit');
		}
	});

	//////////////////////////////////////////////////////////////////////////////
	// Archive Messages

	// $('.message-listing .select-row').change(function() {
	// 	var selectCount = $('.message-listing .select-row:checked').length;

	// 	$('.message-listing .select-row:not(:checked)').parents('.message-preview').removeClass('selected');
	// 	$('.message-listing .select-row:checked').parents('.message-preview').addClass('selected');

	// 	if(selectCount >= 1) {
	// 		$('#archiveMessages').show();
	// 		$('.filter').hide();
	// 	} else {
	// 		$('#archiveMessages').hide();
	// 		$('.filter').show();
	// 	}
	// });

	//////////////////////////////////////////////////////////////////////////////
});