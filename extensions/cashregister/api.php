<?PHP
error_reporting(E_ALL);
ini_set('display_errors', '1');
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

	function products($searchVal = "") {
		if ($searchVal != "") {
			$searchVal = urldecode($searchVal);
			$query = "SELECT * FROM products WHERE title LIKE '%$searchVal%'";
		} else {
			$query = "SELECT * FROM products";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		return $results;
	}

	function customers($searchVal = "") {
		if ($searchVal != "") {
			$searchVal = urldecode($searchVal);
			$searchArray = explode(" ", $searchVal);
			$query="SELECT * FROM riders WHERE  MATCH (`first_name`, `last_name`, `email`) AGAINST ('";
			$i=0;
			foreach ($searchArray as $word) {
				//if ($i != 0) $query .= " OR ";

				$query .= "+".$word."* ";
     			//$i++;
			}
			$query .= "' IN BOOLEAN MODE)";
		} else {
			$query = "SELECT * FROM riders";
		}
		$stmt = $this->db->dbh->query($query);
		$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//$results['query'] = $query;
		return $results;
	}

}

$cashRegister = new cashRegister($db);

$params = array_slice($request, 5);

$results = call_user_func_array(array($cashRegister, $params[0]), array_slice($params, 1));

echo json_encode($results);