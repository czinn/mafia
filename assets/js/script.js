angular.module("mafiaApp", [
  "btford.socket-io"
]).
factory("socket", function(socketFactory) {
  return socketFactory();
}).
controller("MainCtrl", function($scope, socket) {
  $scope.gameList = [];
  $scope.gameState = {};
  $scope.playerList = [];
  $scope.name = "";
  $scope.view = "enterName"; // enterName, gameList, game
  $scope.roleHidden = true; // Hides all role-related info
  $scope.copInfo = null;

  $scope.canVote = {
    "villager": false,
    "mafia": true,
    "cop": true,
    "doctor": true,
    "jester": false,
    "bodyguard": true
  };

  if(window.localStorage.id === undefined) {
    window.localStorage.id = uuid.v4();
  }

  $scope.range = function(n) {
    var l = [];
    for(var i = 0; i < n; i++) l.push(i);
    return l;
  }

  $scope.me = function() {
    for(var i = 0; i < $scope.playerList.length; i++) {
      if($scope.playerList[i].id === window.localStorage.id.split("-")[0]) {
        return $scope.playerList[i];
      }
    }
    return null;
  }

  // Returns whether this client is the moderator
  $scope.isMod = function() {
    var m = $scope.me();
    if(m)
      return m.mod;
    return false;
  };

  $scope.setName = function() {
    if($scope.name.length >= 3) {
      socket.emit("setName", {id: window.localStorage.id, name: $scope.name});
      $scope.view = "gameList";
    }
  };

  $scope.createGame = function() {
    socket.emit("createGame");
  };

  $scope.joinGame = function(game) {
    socket.emit("joinGame", game);
  };

  $scope.leaveGame = function() {
    socket.emit("leaveGame");
    $scope.view = "gameList";
  }

  $scope.toggleHidden = function() {
    $scope.roleHidden = !$scope.roleHidden;
  }

  // Closes the game to new players
  $scope.closeEntry = function() {
    socket.emit("gameAction", {type: "close"});
  };

  $scope.changeRoleCount = function(role, delta) {
    $scope.gameState.settings.roles[role] += delta;
  };

  $scope.countRoles = function() {
    if(!$scope.gameState || !$scope.gameState.settings || !$scope.gameState.settings.roles) return 0;

    var count = 0;
    for(var role in $scope.gameState.settings.roles) {
      if($scope.gameState.settings.roles.hasOwnProperty(role)) {
        count += $scope.gameState.settings.roles[role];
      }
    }
    return count;
  }

  $scope.countDead = function() {
    var count = 0;
    $scope.playerList.forEach(function(p) {
      if(p.dead) count++;
    });
    return count;
  }

  $scope.submitSettings = function() {
    socket.emit("gameAction", {type: "settings", data: $scope.gameState.settings});
  };

  $scope.startNight = function() {
    socket.emit("gameAction", {type: "night"});
  };

  $scope.clickPlayer = function(player) {
    if($scope.isMod() && $scope.gameState.started && !$scope.gameState.night) {
      // Lynch the player
      socket.emit("gameAction", {type: "lynch", data: player.id});
    } else if($scope.gameState.started && $scope.gameState.night && $scope.canVote[$scope.me().role] && player.role != $scope.me().role) {
      // Vote for the player
      socket.emit("gameAction", {type: "vote", data: player.id});
    }
  };

  socket.on("gameList", function(gameList) {
    $scope.gameList = gameList;
  });

  socket.on("gameState", function(gameState) {
    $scope.gameState = gameState;
    $scope.view = "game";
  });

  socket.on("playerList", function(playerList) {
    $scope.playerList = playerList;
    $scope.view = "game";
  });

  socket.on("copInfo", function(copInfo) {
    $scope.copInfo = copInfo;
  })
});