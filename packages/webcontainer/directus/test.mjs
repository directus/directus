import fetch from 'node-fetch';

const response = await fetch('http://localhost:8055/items/articles');
const data = await response.json();

console.log(data)
