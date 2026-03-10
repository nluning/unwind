import http from 'http'
import url from 'url'

const server = http.createServer((req, res) => {
    const parts = req.url?.split('/');

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({status: 'ok'}));

    } else if (req.method === 'GET' && parts[1] === 'hello') && parts?[2] {
        const name = parts[2];
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({status: `Hello ${name}!`}));
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: 'No bunnies here' }));
    }
});

const PORT = 3000;

server.listen(PORT, 'localhost', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

