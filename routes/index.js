var fs = require("fs");
var path = require("path");

module.exports = function(app) {
    fs.readdirSync(__dirname).forEach(function(file) {
        if(file === "index.js") {
            return;
        }
        
        // Require the route and pass app
        require(path.join(__dirname, file))(app);
    });
};
