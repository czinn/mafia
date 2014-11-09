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

    function cleanGameList() {
      // See if any games can be removed
      for(var i = 0; i < games.length; i++) {
        // If there aren't any players in the game, or it's been more than 15 minutes
        if(games[i].players.length == 0 || new Date() - games[i].lastUpdate > 1000 * 60 * 15) {
          // Mark as deleted
          games[i].deleted = true;

          games.splice(i, 1);
          i--;
        }
      }
    }

    // Sends the updated game list to everyone
    function updateGameList() {
      cleanGameList();

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
      cleanGameList();
      socket.emit("gameList", gameList());
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
        } else if(games[i].room === data && games[i].closed) {
          updateGameList();
        }
      }
    });

    socket.on("leaveGame", function(data) {
      if(game && game.deleted) game = null;
      if(!id || !name || !game) return;

      game.leavePlayer(id);
      game = null;
      updateGameList();
    });

    socket.on("gameAction", function(data) {
      if(game && game.deleted) game = null;
      if(!id || !name || !game) return;
      game.gameAction(id, data.type, data.data);
    });
  });
};