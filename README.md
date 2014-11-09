# Mafia

A minimalist webapp for playing Mafia without the need for a game master.

[http://mafia.semicolon.ca](Live version)

## Development

Clone and run `npm install` and `bower install`.

Run with `node index.js`.

Note: clients use cookies to identify themselves to the server in case of a disconnect or page refresh, so you'll need to open different browsers or incognito tabs to test.

## Playing

The server handles all the nighttime logic, but daytime discussion and lynching is left to the players. The moderator tells the server who gets lynched.