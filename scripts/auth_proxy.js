const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Auth Proxy (JS Version): The Vault Server
 * Zero dependencies, zero build time, 100% reliable.
 */

const PORT = 8080;
const TARGET_HOST = 'api.metacall.io';
const API_KEY = process.env.METACALL_API_KEY;

if (!API_KEY) {
    console.error('[Auth Proxy] ERROR: METACALL_API_KEY not set.');
    process.exit(1);
}

const server = http.createServer((req, res) => {
    console.log(`[Auth Proxy] Intercepted: ${req.method} ${req.url}`);
    const targetUrl = new URL(req.url || '/', `https://${TARGET_HOST}`);
    
    const options = {
        hostname: TARGET_HOST,
        port: 443,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            'Authorization': `jwt ${API_KEY}`,
            'host': TARGET_HOST
        }
    };

    delete options.headers['authorization'];

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[Auth Proxy] Forwarding Error: ${err.message}`);
        res.writeHead(502);
        res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`[Auth Proxy] Vault active on http://localhost:${PORT}`);
});
