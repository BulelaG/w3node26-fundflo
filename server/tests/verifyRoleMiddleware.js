const assert = require('node:assert/strict');
const app = require('../src/server');

const protectedRequests = [
  { method: 'POST', path: '/api/agent/trigger' },
  { method: 'POST', path: '/api/programmes', body: { name: 'Test', totalBudget: 10 } },
  { method: 'PATCH', path: '/api/programmes/PRG-WTC-2026', body: { name: 'Updated' } },
  { method: 'PATCH', path: '/api/programmes/PRG-WTC-2026/toggle-pause' },
  { method: 'POST', path: '/api/beneficiaries', body: { fullName: 'Test User' } },
  { method: 'PATCH', path: '/api/beneficiaries/STU-001', body: { monthlyAllowance: 20 } },
  { method: 'POST', path: '/api/demo/reset' }
];

async function request(baseUrl, route, role) {
  const response = await fetch(`${baseUrl}${route.path}`, {
    method: route.method,
    headers: {
      ...(role ? { 'x-user-role': role } : {}),
      ...(route.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: route.body ? JSON.stringify(route.body) : undefined
  });
  return response;
}

async function run() {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    for (const route of protectedRequests) {
      for (const role of ['STUDENT', 'AUDITOR', undefined]) {
        const response = await request(baseUrl, route, role);
        assert.equal(
          response.status,
          403,
          `${role || 'missing role'} should be forbidden for ${route.method} ${route.path}`
        );
        const body = await response.json();
        assert.equal(body.error, 'Forbidden');
      }
    }

    for (const role of ['CFO', 'cfo', 'ADMIN']) {
      const response = await request(baseUrl, {
        method: 'POST',
        path: '/api/demo/reset'
      }, role);
      assert.equal(response.status, 200, `${role} should be allowed to reset the demo`);
    }

    console.log('Role middleware verification passed.');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

run().catch((error) => {
  console.error('Role middleware verification failed:', error);
  process.exitCode = 1;
});
