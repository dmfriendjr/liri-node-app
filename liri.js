require("dotenv").config();
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');

let apiKeys = require('./keys');

let spotifyClient = new Spotify(apiKeys.spotify);
let twitterClient = new Twitter(apiKeys.twitter);

let userCommand = process.argv[2];

switch(userCommand) {
	case 'my-tweets':
		getLastTweets();
		break;
	case 'spotify-this-song':
		break;
	case 'movie-this':
		break;
	case 'do-what-it-says':
		break;
}

function getLastTweets() {


	twitterClient.get('statuses/home_timeline', function(error, tweets, response) {
		if (error) {
			return console.log(error);
		}
	
		tweets.forEach( (tweet) => {
			console.log(tweet.created_at);
			console.log(tweet.text);
			console.log('-----------');
		});
	});

}
