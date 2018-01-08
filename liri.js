require("dotenv").config();
let Twitter = require('twitter');
let Spotify = require('node-spotify-api');
let request = require('request');
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
		getMovieInfo(getUserInput());
		break;
	case 'do-what-it-says':
		break;
}

function getMovieInfo(search) {
	if (search.length === 0) search = 'Mr. Nobody';
	
	request(`http://www.omdbapi.com/?apikey=${apiKeys.omdb.key}&t=${search}`, function (err, response, body) {
		body = JSON.parse(body);
		console.log(`Title: ${body.Title}`);
		console.log(`Release Year: ${body.Year}`);
		body.Ratings.forEach( (rating) => {
			console.log(`${rating.Source}: ${rating.Value}`);
		});
		console.log(`Country: ${body.Country}`);
		console.log(`Language: ${body.Language}`);
		console.log(`Plot: ${body.Plot}`);
		console.log(`Actors: ${body.Actors}`);
	});
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

		console.log('-----Song Results-----');

		response.tracks.items.forEach( (result, index) => {
			console.log(`${index}) ${result.name} by ${result.artists[0].name}`);
		});

		console.log('Please enter number of desired track');
		process.stdin.resume();
		process.stdin.once("data", function(data) {
			let displayTrack = response.tracks.items[parseFloat(data)];
			console.log(`-----Result-----`);
			console.log(`Song: ${displayTrack.name} by ${displayTrack.artists[0].name}`);
			console.log(`Album: ${displayTrack.album.name}`);
			console.log(`Preview Link: ${displayTrack.href}`);
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
