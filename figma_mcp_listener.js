const http = require('http');

const PORT = 3845;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      const id = data.id || 1;
      
      // JSON-RPC 2.0 MCP Handshake Response
      const response = {
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'figma-dev-mode-mcp-server',
            version: '1.0.0'
          }
        }
      };

      res.writeHead(200);
      res.end(JSON.stringify(response));
    } catch (e) {
      res.writeHead(200);
      res.end(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Figma MCP Listener] Active and listening on http://127.0.0.1:${PORT}/mcp`);
});
