<?PHP
require dirname(__FILE__) . '/../../api/api.php';
header("Content-Type: application/json; charset=utf-8");

$request = explode('/', substr($_SERVER['REQUEST_URI'], 1));
foreach($request as $k => $v)
    if(!$v) unset($request[$k]);
$request = array_values($request);


class cashRegister {

	function __construct($arg1) {
      $this->db = $arg1;
   	}

	function products($searchVal) {
		if ($searchVal) {
			$query = "SELECT * FROM PRODUCTS WHERE title LIKE '%$searchVal%'";
		} else {
			$query = "SELECT * FROM PRODUCTS";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

	function customers() {
		$stmt = $this->db->dbh->query('SELECT * FROM users');
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

}

$cashRegister = new cashRegister($db);

$params = array_slice($request, 5);

$results = call_user_func_array(array($cashRegister, $params[0]), array_slice($params, 1));

echo json_encode($results);