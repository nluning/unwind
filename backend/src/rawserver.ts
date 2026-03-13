// import http from 'http'

// const server = http.createServer((req, res) => {
//     try {
//     const parts = req.url?.split('/');

//     if (req.method === 'GET' && req.url === '/health') {
//         res.writeHead(200, {'Content-Type': 'application/json'});
//         res.end(JSON.stringify({status: 'ok'}));

//     } else if (req.method === 'GET' && parts?.[1] === 'hello' && parts?.[2]) {
//         const name = parts[2];
//         res.writeHead(200, {'Content-Type': 'application/json'});
//             try {res.end(JSON.stringify({status: `Hello ${name}!`}))}
//             catch {res.end(JSON.stringify({error: 'no valid name'}))}

//     } else if (req.method === 'POST' && parts?.[1] === 'echo') {
//         let body = '';
//         req.on('data', chunk => {body += chunk});
//         req.on('end', () => {const parsedBody = (JSON.parse(body))
//             res.end(JSON.stringify(parsedBody))})
            
//         } else {
//         res.writeHead(404, {'Content-Type': 'application/json'});
//         res.end(JSON.stringify({ error: 'No bunnies here' }));
//     }
// }
// catch {res.writeHead(500, {'Content-Type': 'application/json'});
//         res.end(JSON.stringify({error: 500}))}
// });

// const PORT = 3000;

// server.listen(PORT, 'localhost', () => {
//     console.log(`Server running at http://localhost:${PORT}/`);
// });

