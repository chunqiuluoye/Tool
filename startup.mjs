import http from 'node:http';

// Probe loopback directly so a system HTTP proxy cannot affect startup checks.
function readLocal(port, path) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: '127.0.0.1', port, path }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error('Unexpected HTTP status')); return; }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
        if (body.length > 65536) request.destroy(new Error('Response too large'));
      });
      response.on('end', () => resolve(body));
      response.on('error', reject);
    });
    const timer = setTimeout(() => request.destroy(new Error('Probe timed out')), 1500);
    request.on('close', () => clearTimeout(timer));
    request.on('error', reject);
  });
}

export async function findRunningGame(port) {
  try {
    const info = JSON.parse(await readLocal(port, '/api/network'));
    if (info.port !== port || !Array.isArray(info.addresses)) return null;
    if (info.app === 'neon-fist') return info;
    // Recognize the original version, which predates the app identity field.
    const page = await readLocal(port, '/');
    return page.includes('<title>NEON FIST · 像素街霸</title>') && page.includes('id="arena"') ? info : null;
  } catch { return null; }
}
