const http = require('http');

http.get('http://localhost:3001/devices/discovered', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const devices = JSON.parse(data);
    console.log("DISCOVERED API RESPONSE:", JSON.stringify(devices, null, 2));
  });
});
