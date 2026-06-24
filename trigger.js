const http = require('http');

const data = JSON.stringify({ deviceIds: ["DEV-427195DA"] });

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/devices/install-aggregator',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
