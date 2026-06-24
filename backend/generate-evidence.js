const http = require('http');

async function makeRequest(path, email) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'x-test-email': email
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- VALIDATING ABC TENANT ---');
  const abcUser = await makeRequest('/auth/me', 'admin@abc.xarc.com');
  console.log('ABC User Payload:', JSON.stringify(abcUser, null, 2));
  
  const abcDevices = await makeRequest('/devices', 'admin@abc.xarc.com');
  console.log(`ABC Devices (${abcDevices.length} found):`, abcDevices.map(d => d.deviceId));

  const abcDashboard = await makeRequest('/admin/dashboard/summary', 'admin@abc.xarc.com');
  console.log('ABC Dashboard Summary:', JSON.stringify(abcDashboard, null, 2));

  console.log('\n--- VALIDATING XYZ TENANT ---');
  const xyzUser = await makeRequest('/auth/me', 'admin@xyz.xarc.com');
  console.log('XYZ User Payload:', JSON.stringify(xyzUser, null, 2));
  
  const xyzDevices = await makeRequest('/devices', 'admin@xyz.xarc.com');
  console.log(`XYZ Devices (${xyzDevices.length} found):`, xyzDevices.map(d => d.deviceId));

  const xyzDashboard = await makeRequest('/admin/dashboard/summary', 'admin@xyz.xarc.com');
  console.log('XYZ Dashboard Summary:', JSON.stringify(xyzDashboard, null, 2));
}

run().catch(console.error);
