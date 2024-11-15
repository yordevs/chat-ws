# Chat API Reference (WebSocket Version)
The original Chat-API (https://github.com/yordevs/Chat-API) was developed as a way to teach the concept of a REST API. This is a re-implementation of the same features but now included websocket support to enable real time message retrieval without continuous polling.

No authentication is required however ensure you have `"Content-Type: application/json"` in your request header.

## REST Endpoints:
In a Websocket environment, there is still a place traditional endpoints where a simple request-response architecture is all that is required.
### GET /rooms
Returns a list of all rooms that currently contain messages.

*Example Response:*
```json
{
    "rooms": [
        "Will Test Room"
    ]
}
```

## HTTP Error Responses
Error responses may be returned if the request is an invalid format or if an invalid endpoint is requested. An invalid format will result in a status code `400` and an unknown endpoint will return `404`.

A JSON formatted response may provide an additional error message.

*Example error response:*
```json
{
    "error": "room_id not provided"
}
```

## Websocket Commands
### Connecting to the Websocket
Since websockets are stateful, before they can be used, a connection to the websocket server must be established. An example is shown in JavaScript
```javascript
const socket = new WebSocket("ws://<host>:3000");
```

### SPEAK/LISTEN: Join Room
Before a client can send messages into a room, they must join said room. This is so they 'subscribe' to any communication occurring within that room. Join room requests are re-broadcast to existing members of the group so they can see new users joining

*Example Request:*
```json
{
    "type": "join-room",
    "room_id": "general",
    "from": "Will Hall"
}
```

### SPEAK/LISTEN: Leave Room
If a user wishes to cease receiving messages, they can leave a room. This event is re-broadcast to all other members of the room.
*Example Request:*
```json
{
    "type": "leave-room",
    "room_id": "general",
    "from": "Will Hall"
}
```


### SPEAK: Send Message
To trigger a message to be sent to a room, a websocket request should be formatted as follows

*Example send message:*
```json
{
    "type": "send-message",
    "room_id": "general",
    "from": "Will Hall",
    "message": "Hello world!"
}
```

### LISTEN: Receive Message
Your server should implement a listener for new messages. New message events will be characterized by `"type": "receive-message"` so you can listen for such events.

*Example new message:*
```json
{
    "type": "receive-message",
    "room_id": "general",
    "from": "Will Hall",
    "message": "Hello world!",
    "sent_at": 1730758663.598467
}
```