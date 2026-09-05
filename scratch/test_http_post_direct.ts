import https from 'https';

function testPost() {
  console.log('Testing direct HTTP POST to https://willshop-os.vercel.app/api/organization/create ...');

  const data = JSON.stringify({ name: 'Test Direct POST' });

  const options = {
    hostname: 'willshop-os.vercel.app',
    port: 443,
    path: '/api/organization/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`HTTP STATUS: ${res.statusCode} ${res.statusMessage}`);
    console.log('HEADERS:', res.headers);

    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('RESPONSE BODY:', body.substring(0, 300));
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e);
  });

  req.write(data);
  req.end();
}

testPost();
