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
		getSongInfo(getUserInput());
		break;
	case 'movie-this':
		break;
	case 'do-what-it-says':
		break;
}

function getLastTweets() {
	twitterClient.get('statuses/home_timeline', { tweet_mode: 'extended' }, function(error, tweets, response) {
		if (error) {
			return console.log(error);
		}
		console.log(`********************Twitter********************`);

		tweets.forEach( (tweet) => {
			console.log(tweet.user.screen_name);
			console.log(tweet.created_at);
			if (tweet.retweeted_status) {
				console.log(tweet.retweeted_status.full_text);
			} else {
				console.log(tweet.full_text);
			}
			console.log('-----------');
		});
	});
}

function getSongInfo(song) {
	if (song.length === 0) song = 'The Sign';

	spotifyClient.search({ type: 'track', query: song }, function(err, response) {
		if (err) return console.log(err);

		console.log(song);
		console.log('-----Song Results-----');
		console.log(response.tracks.items[0].name);
		response.tracks.items.forEach( (result, index) => {
			//console.log(result);
			console.log(`${index}) ${result.name} by ${result.artists[0].name}`);
		});

		console.log('Please enter number of desired track');
		let selection = process.stdin.read();
		process.stdin.resume();
		process.stdout.write('Please enter number of desired track');
		process.stdin.once("data", function(data) {
			let displayTrack = response.tracks.items[parseFloat(data)];
			console.log(`${displayTrack.name} by ${displayTrack.artists[0].name}`);
			console.log(displayTrack.album.name);
			process.stdin.pause();
		});
	});
}

function getUserInput() {
	let input = '';

	for (let i = 3; i < process.argv.length; i++) {
		input += ' ' + process.argv[i];	
	}

	return input;
}
