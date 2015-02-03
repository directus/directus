$(window).ready(function() {

  switch(step) {
    case 1:
      CheckStep1();
      break;
    case 2:
      CheckStep2();
      break;
    case 3:
      CheckStep3();
      break;
  }

  $('input').on('change keypress paste focus textInput input', function(e) {
    switch(step) {
      case 1:
        CheckStep1();
        break;
      case 2:
        CheckStep2();
        break;
      case 3:
        CheckStep3();
        break;
    }
  });

  function CheckStep1() {
    var name = $('input[name=site_name]').val();
    var path = $('input[name=directus_path]').val();
    var email = $('input[name=email]').val();
    var pass = $('input[name=password]').val();
    var passconfirm = $('input[name=password_confirm]').val();

    if(name && email && pass && passconfirm && pass === passconfirm) {
      $('button[type=submit]').removeClass('disabled');
    } else {
      $('button[type=submit]').addClass('disabled');
    }
  }
  function CheckStep2() {
    var name = $('input[name=host_name]').val();
    var user = $('input[name=username]').val();
    var pass = $('input[name=password]').val();
    var dbname = $('input[name=db_name]').val();

    if(name && user && pass && dbname) {
      $('button[type=submit]').removeClass('disabled');
    } else {
      $('button[type=submit]').addClass('disabled');
    }
  }

  function CheckStep3() {
    $('button[type=submit]').removeClass('disabled').html('Install').attr('name', 'install');
  }

  $('button').click(function(e) {
    if($(e.target).hasClass('disabled')) {
      e.preventDefault();
      return false;
    }
  });
  var fetching = false;
  $('#retryButton').click(function(e) {
    $target = $(e.target);
    if(fetching) {
      return;
    }
    fetching = true;

    $.get('config_test.php', function(res) {
      fetching = false;
      if(res === 'true') {
        $('#failSpan').html('<span class="label label-success">Yes</span>');
      }
    });
  });
});