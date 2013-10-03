<?php
// Composer Autoloader
$loader = require 'api/vendor/autoload.php';
$loader->add("Directus", dirname(__FILE__) . "/api/core/");

// Non-autoloaded components
require 'api/api.php';

use Directus\View\JsonView;
use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;

// No access, forward to login page
if (!AuthProvider::loggedIn()) {
	header('Location: ' . DIRECTUS_PATH . 'login.php');
	die();
}

$acl = Bootstrap::get('acl');
$ZendDb = Bootstrap::get('ZendDb');

$data = array();

$requestNonceProvider = new RequestNonceProvider();
$data['nonces'] = array_merge($requestNonceProvider->getOptions(), array(
	'pool' => $requestNonceProvider->getAllNonces()
));

$DirectusStorageAdaptersTableGateway = new DirectusStorageAdaptersTableGateway($acl, $ZendDb);
$data['storage_adapters'] = $DirectusStorageAdaptersTableGateway->fetchAllByIdNoParams();
$adaptersByUniqueRole = array();
foreach($data['storage_adapters'] as $adapter) {
	if(!empty($adapter['role'])) {
		$adaptersByUniqueRole[$adapter['role']] = $adapter;
	}
}
$data['storage_adapters'] = array_merge($data['storage_adapters'], $adaptersByUniqueRole);


$path = DIRECTUS_PATH;
?>

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <style>
  	body { font-family: monaco; font-size:11px; background-color:#CCC; }
  	textarea { width: 90%; margin:0px; height:250px;}
  	label {display: block;}
  	input, textarea {margin-top:0px; border:0px; padding:5px 8px; font-family: monaco;}
  	fieldset {border:0;}
  	input[type=button] { font-size:14px; background-color:#666; color:#FFF; margin-left:10px;}
  </style>
</head>

<body>

<fieldset>
<label>URL:</label>
<input type="text" id="url" style="width:90%" value="<?php echo 'http://' . $_SERVER['HTTP_HOST'] . $path . 'api/1/'?>">
</fieldset>

<fieldset>
<label>JSON Payload:</label>
<textarea id="payload">
</textarea>
</fieldset>

<input type="button" value="POST">

<fieldset style="margin-top:10px">
<label>Response:</label>
<textarea id="response" style="height:700px">
</textarea>
</fieldset>



<script src="assets/js/libs/jquery.js"></script>
<script src="assets/js/libs/underscore.js"></script>


<script>
$(function() {
	var postRequest	= function(options) {
		var json, data;

		try {
			json = JSON.parse(options.payload)
		} catch(err) {
			alert('The data is not valid JSON');
		}

		data = JSON.stringify(json);

		$.post(options.url, data)
			.done(function(response) {
				var val = _.isObject(response) ? JSON.stringify(response, 2) : response;
				$('#response').val(val);
			})
			.error(function(obj) {
				$('#response').val(obj.responseText);
			});
	}

	$('input[type=button]').on('click', function() {
		postRequest({
			url: 		$('#url').val(),
			seperator:  $('#payload-seperator').val(),
			payload:    $('#payload').val(),
		});
	});
});
</script>

</body>
</html>