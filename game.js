var uuid = require("node-uuid");

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
  this.started = false;

  this.moderator = null; // First player to join
}

function addPlayer(id, socket, name) {
  this.players.push(new Player(id, socket, name));

  if(this.moderator == null)
    this.moderator = id;
}

function reconnectPlayer(id, socket, name) {
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].id == id) {
      this.players[i].socket = socket;
      this.players[i].name = name;
      return true;
    }
  }
  return false;
}

function playerById(id) {
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].id == id) {
      return this.players[i];
    }
  }
  return null;
}

// Determines the number of votes for a specific player from a specific role
function votesForBy(id, role) {
  var count = 0;
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].votingFor == id && this.players[i].role = role)
      count++;
  }
  return count;
}

// Makes a list of players for a specific player
function playerListFor(id) {
  var p = this.playerById(id);
  if(p == null) return [];

  var list = [];
  for(var i = 0; i < this.players; i++) {
    var obj = {
      name: this.players[i].name,
      role: this.players[i].role == p.role || this.players[i].lynched ? this.players[i].role : null,
      votes: this.players[i].role == p.role ? votesForBy(this.players[i].id, p.role) : 0,
      mod: this.players[i].id == this.moderator,
      dead: this.players[i].dead
    };
    list.push(obj);
  }

  return list;
}

module.exports = Game;