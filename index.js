const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const MESSAGE_STORE = {}; 
const ROOMS = new Map();  

// broadcast a message to a room
function to(room, data, sender) {
  if (ROOMS.has(room)) {
    ROOMS.get(room).forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

wss.on("connection", (ws) => {
  console.log("A new client connected.");

  ws.on("message", (data) => {
    const { type, room, message, username } = JSON.parse(data);

    if (type === "join-room") {
      // Join the specified room
      if (!ROOMS.has(room)) {
        ROOMS.set(room, []);
      }
      ROOMS.get(room).push(ws);

      // Send the previous messages of the room to the client
      const messages = MESSAGE_STORE[room] || [];
      messages.forEach(({ content, username }) => {
        ws.send(JSON.stringify({ type: "receive-message", content, username }));
      });

      ws.send(JSON.stringify({ type: "status", content: `Joined ${room}` }));
    }

    if (type === "send-message") {
      const newMessage = { content: message, username, timestamp: Date.now() };

      // Store the message in the room's message store
      if (!MESSAGE_STORE[room]) {
        MESSAGE_STORE[room] = [];
      }
      MESSAGE_STORE[room].push(newMessage);

      // Broadcast the message to the room
      to(room, { type: "receive-message", content: message, username }, ws);
    }
  });

  ws.on("close", () => {
    console.log("A client disconnected.");

    // Remove the client from all rooms they joined
    ROOMS.forEach((clients, room) => {
      ROOMS.set(room, clients.filter(client => client !== ws));
    });
  });
});
