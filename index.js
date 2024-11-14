const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const MESSAGE_STORE = {}; 
const ROOMS = new Map();
const CLIENT_NAMES = new Map(); // Stores a mapping to associate connection objects to names

// Simple HTTP Webserver for REST Requests
var http = require('http');
http.createServer(function (req, res) {
  // Allow clients to query rooms using REST
  if (req.url === "/rooms") {
    res.writeHead(200, {'Content-Type': 'application/json'});
    console.log(ROOMS.keys())
    res.write(JSON.stringify({
      rooms: Array.from(ROOMS.keys())
    }));
    res.end();
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({
      error: "Endpoint not found"
    }));
    res.end();
  }
  
}).listen(8080); 

// broadcast a message to a room
function to(room, data) {
  if (ROOMS.has(room)) {
    ROOMS.get(room).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

wss.on("connection", (ws) => {
  console.log("A new client connected.");

  ws.on("message", (data) => {
    const { type, room_id, message, from } = JSON.parse(data);

    /**
     * User joins a new room
     */
    if (type === "join-room") {
      // Join the specified room
      if (!ROOMS.has(room_id)) {
        ROOMS.set(room_id, []);
      }

      // Ignore requests to join a room user is already a member of
      if (!ROOMS.get(room_id).includes(ws)) {
        ROOMS.get(room_id).push(ws);

        // Associate the from name with this connection
        CLIENT_NAMES.set(ws, from);

        // Send the previous messages of the room to the client
        const messages = MESSAGE_STORE[room_id] || [];
        messages.forEach(message => {
          var messageMessage = Object.assign({type: "receive-message"}, message);
          ws.send(JSON.stringify(messageMessage));
        });

        console.log("User joined room")

        // Broadcast join event to all room users
        to(room_id, JSON.parse(data))
      }
      
    }

    /**
     * User leaves a room
     */
    if (type === "leave-room") {
      // Join the specified room
      if (ROOMS.has(room_id)) { // Ignore requests to leave a room if user is not a member
        ROOMS.get(room_id).delete(ws);
        
        // Broadcast join event to all room users
        to(room_id, JSON.parse(data));

        // Send the leave event confirmation to sending user as confirmation
        ws.send(JSON.parse(data));
      }

      
    }

    /**
     * Message incoming from client
     */
    if (type === "send-message") {
      const newMessage = { room_id, from, message, sent_at: Date.now() };

      // Store the message in the room's message store
      if (!MESSAGE_STORE[room_id]) {
        MESSAGE_STORE[room_id] = [];
      }
      MESSAGE_STORE[room_id].push(newMessage);

      // Broadcast the message to the room
      to(room_id, Object.assign({type: "receive-message"}, newMessage));
    }
  });

  ws.on("close", () => {
    console.log("A client disconnected.");

    // Remove the client from all rooms they joined
    ROOMS.forEach((clients, room) => {
      ROOMS.set(room, clients.filter(client => client !== ws));
      to(room, {type: "leave-room", room_id: room, from: CLIENT_NAMES.get(ws)});
    });

    // Remove the client from the list of client names
    if (CLIENT_NAMES.has(ws)) {
      CLIENT_NAMES.delete(ws);
    }
    
  });
});
