<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Accept, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API Key already set
$api_key = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQyMDk4NjQsImlhdCI6MTc2MjY3Mzg2NCwicmF5IjoiOTMwN2EwYTk3ZTBlODEzYjM1NzJkMWJlNGI5YzFlNjQiLCJzdWIiOjMwOTA0Mzl9.DSBVHlWaSFPHLdfRYquEXaI5-1K7DFMG7s7N4W3qHumEy7YYpfmnG6RxgaIgOwgFlGsu4JPA4P_fUw6JvTizOhlbo75TT2-H1Z-8cF44meKBa0jr1CjvjEmwV3a6okY02UgEDGx9fHQIRegBNCG2okHoCWJWBJ1RCUu-vCcDl7c4CAQagNmCkfDNzx8JXDG3iHYir_gOROzxf9HUlC5dbzNze9IhuPce64SLGPls60wfD2W8D4XeoNc1uay0KqmcdWGrACn1zLNzFZPnYqs5cWtByLRwFqN-kwm1BwtqI8mP-ZK5-66qqhakP7K96N0ocmFGLnCa-5a4e0fTMTGQZw';
$base_url = 'https://5sim.net/v1/';

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Simple router
if (strpos($path, '/api/') === 0) {
    $endpoint = str_replace('/api/', '', $path);
    $full_url = $base_url . $endpoint;
    
    // Add query parameters
    if (!empty($_GET)) {
        $full_url .= '?' . http_build_query($_GET);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $full_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $api_key,
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($http_code);
    echo $response;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
?>
