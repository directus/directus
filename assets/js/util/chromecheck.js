(function () {

  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  if (!isChrome) {
    alert('For best performance, we recommend that you use Directus with Google Chrome.');
  }

}());