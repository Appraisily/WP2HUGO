const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  keyword: 'art appraisal of antique lamps'
});

console.log('Sending request to test the workflow...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received:');
    try {
      console.log(JSON.parse(responseData));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();