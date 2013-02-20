<?PHP
$data = array(
	array('symbol'=>'✌'),
	array('symbol'=>'☂'),
	array('symbol'=>'⚛'),
	array('symbol'=>'♫')
);
header("Content-Type: application/json; charset=utf-8");
echo json_encode($data);