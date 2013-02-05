<?PHP

function map_columns() {

}

$data = [',,,','SSS',',o,o,','MIMIMIMI'];

$columns = array();

foreach($data as $row) {
	$item = array(
			'table_name' => 'demo_table',
			'column_name' => $row['id'],
			'ui' => $row['ui']
		);
}