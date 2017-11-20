$(window).ready(function () {

  switch (step) {
    case 1:
      CheckLanguageStep();
      break;
    case 2:
      CheckProjectStep();
      break;
    case 3:
      CheckDatabaseStep();
      break;
    case 4:
      CheckConfirmationStep();
      break;
  }

  $('input').on('change keypress paste focus textInput input', function (e) {
    switch (step) {
      case 1:
        CheckLanguageStep();
        break;
      case 2:
        CheckProjectStep();
        break;
      case 3:
        CheckDatabaseStep();
        break;
      case 4:
        CheckConfirmationStep();
        break;
    }
  });

  function CheckProjectStep() {
    var name = $('input[name=directus_name]').val();
    var path = $('input[name=directus_path]').val();
    var email = $('input[name=directus_email]').val();
    var pass = $('input[name=directus_password]').val();
    var passconfirm = $('input[name=directus_password_confirm]').val();

    if (name && email && pass && passconfirm && pass === passconfirm) {
      $('button[type=submit]').removeClass('disabled');
    } else {
      $('button[type=submit]').addClass('disabled');
    }
  }

  function CheckDatabaseStep() {
    var name = $('input[name=db_host]').val();
    var user = $('input[name=db_user]').val();
    // password could be empty
    // var pass = $('input[name=password]').val();
    var dbname = $('input[name=db_name]').val();

    if (name && user /*&& pass*/ && dbname) {
      $('button[type=submit]').removeClass('disabled');
    } else {
      $('button[type=submit]').addClass('disabled');
    }
  }

  function CheckConfirmationStep() {
    // nothing, strict mode warning removed
    $('button[type=submit]').removeClass('disabled').html('Install').attr('name', 'install')
  }

  function CheckLanguageStep() {
    $('button[type=submit]').removeClass('disabled');
  }

  $('button').click(function (e) {
    if ($(e.target).hasClass('disabled')) {
      e.preventDefault();
      return false;
    }
  });

  $('input, select').on("focus blur", function(e) {
    $('label').removeClass('highlight');
    if($(this).is(":focus")){
      $(this).closest('label').addClass('highlight');
    }
  });

  var fetching = false;
  $('#retryButton').click(function (e) {
    e.preventDefault();

    if (fetching) {
      return;
    }

    fetching = true;
    $.get('index.php?step=4&check_config', function (res) {
      fetching = false;
      if (res === 'true') {
        $('#failSpan').html('<span class="label label-success">Yes</span>');
      }
    });
  });
});
