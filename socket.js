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

    function gameList() {
      var list = [];
      games.forEach(function(g) {
        if(!g.closed) {
          list.push(g.room);
        }
      });
      return list;
    }

    // Sends the updated game list to everyone
    function updateGameList() {
      io.sockets.emit("gameList", gameList());
    }

    socket.on("setName", function(data) {
      name = data.name;
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
    });

    socket.on("createGame", function(data) {
      if(!id || !name || game) return;

      game = new Game(io);
      games.push(game);
      game.addPlayer(id, socket, name);
      updateGameList();
    });

    socket.on("joinGame", function(data) {
      if(!id || !name || game) return;

      for(var i = 0; i < games.length; i++) {
        if(games[i].room === data && !games[i].closed) {
          game = games[i];
          game.addPlayer(id, socket, name);
        }
      }
    });

    socket.on("gameAction", function(data) {
      if(!id || !name || !game) return;
      game.gameAction(id, data.type, data.data);
    });
  });
};