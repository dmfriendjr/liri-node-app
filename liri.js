require("dotenv").config();

let apiKeys = require('./keys');

let spotify = new Spotify(apiKeys.spotify);
let client = new Twitter(apiKeys.twitter);
