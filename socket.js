var Game = require("./game");

module.exports = function(server) {
  var io = require("socket.io").listen(server);
  
  var games = [];
  
  // Connection handler
  io.sockets.on("connection", function(socket) {
    console.log("A user connected via Socket.IO.");
    
    var id = null; // the client's id
    var name = null;
    var game = null;

    socket.on("setName", function(data) {
      if(id === null) {
        id = data.id;
        // Try to reconnect to all games
        for(var i = 0; i < games.length; i++) {
          if(games[i].reconnectPlayer(id, socket, name)) {
            game = games[i]; // This points to the game object
            break;
          }
        }
      }
      name = data.name;
    });

    socket.on("createGame", function(data) {
      if(!id || !name || game) return;

      game = new Game(io);
      games.push(game);
      game.addPlayer(id, socket, name);
    });

    socket.on("joinGame", function(data) {
      if(!id || !name || game) return;

      for(var i = 0; i < this.games.length; i++) {
        if(this.games[i].room === data && !this.games[i].closed) {
          game = games[i];
          game.addPlayer(id, socket, name);
        }
      }
    });
  });
};