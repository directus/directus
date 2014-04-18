(function () {

  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");


  if (msie >= 0) {
    alert('For best performance, we recommend that you use Directus with Google Chrome.');
  }

}());