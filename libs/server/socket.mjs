import { WebSocketServer, WebSocket } from 'ws';

export const createSocketServer = (server) => {
  const sockets = new Set();
  const wss = new WebSocketServer({ server });
  wss.on('connection', ws => {
    sockets.add(ws);
    ws.on('open', () => console.log('open'))
    ws.on('error', (err) => console.error(err));
    ws.on('message', function message(data) {
      console.log('received: %s', data);
    });
    ws.on('close', (code, reason) => {
      sockets.delete(ws);
    });
  });

  return {
    publish(cmd, data) {
      const payload = JSON.stringify({ cmd, data });
      for (const socket of sockets) {
        if(socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      }
    }
  };
}
