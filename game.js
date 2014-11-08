var uuid = require("node-uuid");

/* Roles are:
 * - villager
 * - mafia
 * - cop
 * - doctor
 * - jester
 * - bodyguard
 *
 *
 * Not added yet:
 * - vigilante
 */

 var canVote = {
  "villager": false,
  "mafia": true,
  "cop": true,
  "doctor": true,
  "jester": false,
  "bodyguard": true
 }; // role does some sort of action at night

function Player(id, socket, name) {
  this.id = id;
  this.socket = socket;
  this.name = name;

  this.role = null;
  this.votingFor = null;
  this.dead = false;
  this.lynched = false; // Lynched is also dead, but if lynched, role is visible
}

function Game(io) {
  this.io = io;
  this.players = [];
  this.room = uuid.v4(); // Socket room for players to join
  this.closed = false; // closed to new joins (so that the moderator knows how many people there are)
  this.started = false; // game actually started (roles dealt out, etc)
  this.dayNumber = 1; // increases at end of night
  this.night = false; // whether it is night or not

  this.lastAction = ""; // description of the last thing to happen (lynching, night death)

  this.settings = {
    roles: {
      "mafia": 3,
      "cop": 2,
      "doctor": 1,
      "jester": 1
    }
  }; // settings for the game

  this.moderator = null; // First player to join
}

function addPlayer(id, socket, name) {
  this.players.push(new Player(id, socket, name));

  if(this.moderator === null)
    this.moderator = id;
}

function reconnectPlayer(id, socket, name) {
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].id === id) {
      this.players[i].socket = socket;
      this.players[i].name = name;
      return true;
    }
  }
  return false;
}

function playerById(id) {
  for(var i = 0; i < this.players.length; i++) {
    // Check for full id or shortened id
    if(this.players[i].id === id || this.players[i].id.split("-")[0] === id) {
      return this.players[i];
    }
  }
  return null;
}

// Determines the number of votes for a specific player from a specific role
function votesForBy(id, role) {
  var count = 0;
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].votingFor === id && this.players[i].role = role)
      count++;
  }
  return count;
}

// Makes a list of players for a specific player
function playerListFor(id) {
  var p = this.playerById(id);
  if(p === null) return [];

  var list = [];
  for(var i = 0; i < this.players; i++) {
    var obj = {
      id: this.players[i].id.split("-")[0], // shortened id for identification, but can't impersonate
      name: this.players[i].name,
      role: this.players[i].role === p.role || this.players[i].lynched ? this.players[i].role : null,
      votes: this.players[i].role === p.role ? votesForBy(this.players[i].id, p.role) : 0,
      mod: this.players[i].id === this.moderator,
      dead: this.players[i].dead
    };
    list.push(obj);
  }

  return list;
}

// Gets the current game state, suitable for sending to all players
function gameState() {
  var obj = {
    room: this.room,
    closed: this.closed,
    started: this.started,
    dayNumber: this.dayNumber,
    night: this.night,
    settings: this.settings,
    lastAction: this.lastAction
  };
}

// Sends all players the current game state
function sendGameStateUpdate() {
  for(var i = 0; i < this.players.length; i++) {\
  this.players.forEach(function(p) {
    p.socket.emit("gameState", this.gameState());
  });
}

// Sends all players of a specific role the updated player list
// If role is null, sends it to everyone
function sendPlayerListUpdate(role) {
  this.players.forEach(function(p) {
    if(p.role === role || role === null) {
      p.socket.emit("playerList", this.playerListFor(p.id));
    }
  });
}

function dealRoles() {
  var roleList = [];
  for(var role in this.settings.roles) {
    if(this.settings.roles.hasOwnProperty(role)) {
      for(var i = 0; i < this.settings.roles[role]; i++) {
        roleList.push(role);
      }
    }
  }

  // Fill remaining roles with villager
  while(roleList.length < this.players.length) {
    roleList.push("villager");
  }

  // Shuffle the roles
  for(var i = roleList.length - 1; i >= 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = roleList[i];
    roleList[i] = roleList[j];
    roleList[j] = t;
  }

  // Deal one role out to each player
  this.players.forEach(function(p, i) {
    p.role = roleList[i];
  });
}

// Resets some values and starts the night
function startNight() {
  this.players.forEach(function(p) {
    p.votingFor = null;
  });

  this.night = true;

  this.sendGameStateUpdate();
}

// Checks whether all multi-roles agree on what's happening
function isNightOver() {
  var targets = {};
  this.players.forEach(function(p) {
    if(targets[p.role] === undefined || targets[p.role] === p.votingFor) {
      targets[p.role] = p.votingFor;
    } else {
      return false;
    }
  });
  return targets;
}

// Figures out what happened and ends the night
function endNight() {
  var targets = this.isNightOver();

  var deadPeople = [];

  if(targets["mafia"] === targets["bodyguard"]) {
    // Kill off one of the mafia
    this.players.forEach(function(p) {
      if(p.role === "mafia") {
        p.dead = true;
        deadPeople.push(p);
        targets["mafia"] = null;
        return false;
      }
    });
  }

  if(targets["mafia"] === targets["doctor"]) {
    targets["mafia"] = null;
  }

  if(targets["mafia"] !== null) {
    var p = this.playerById(targets["mafia"]);
    p.dead = true;
    deadPeople.push(p);
  }

  // TODO: Send the cops their report

  this.lastAction = "Found dead this morning:";
  deadPeople.forEach(function(p) {
    lastAction.push(" " + p.name);
  });

  this.night = false;

  this.sendGameStateUpdate();
  this.sendPlayerListUpdate(null);
}

function gameAction(id, action, data) {
  if(action === "close") { // Closes the game
    if(id === this.moderator && !this.closed) {
      this.closed = true;
      this.sendGameStateUpdate();
    }
  } else if(action === "settings") {
    if(id === this.moderator && this.closed && !this.started) {
      this.started = true;
      this.settings = data;
      // TODO: Make sure settings are valid; right now, trust that the client is a nice client

      dealRoles();

      this.sendGameStateUpdate();
      this.sendPlayerListUpdate(null);
    }
  } else if(action === "night") {
    if(id === this.moderator && this.started && !this.night) {
      startNight();
    }
  } else if(action === "lynch") {
    if(id === this.moderator && this.started && !this.night) {
      var target = this.playerById(data);
      if(target != null) {
        target.dead = true;
        target.lynched = true;

        this.lastAction = target.name + " was lynched. They were a " + target.role + ".";

        this.sendGameStateUpdate();
        this.sendPlayerListUpdate(null);
      }
    }
  } else if(action === "vote") {
    if(this.started && this.night) {
      var self = this.playerById(id);
      var target = this.playerById(data);
      if(self && target && self.id !== target.id && self.role !== target.role && canVote[self.role]) {
        self.votingFor = data;

        this.sendPlayerListUpdate(self.role);

        // Check if night is over
        if(this.isNightOver()) {
          // End the night!
          this.endNight();
        }
      }
    }
  }
}

module.exports = Game;