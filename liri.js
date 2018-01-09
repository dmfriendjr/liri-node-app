require("dotenv").config();
let Twitter = require('twitter');
let Spotify = require('node-spotify-api');
let request = require('request');
let fs = require('fs');
let readline = require('readline');
let apiKeys = require('./keys');
let date = new Date();

let lineReader = readline.createInterface({
	input: fs.createReadStream('random.txt')
});

let spotifyClient = new Spotify(apiKeys.spotify);
let twitterClient = new Twitter(apiKeys.twitter);

let userCommand = process.argv[2];

processUserCommand(userCommand, getUserInput());

function processUserCommand(command, input) {
	switch(command) {
		case 'my-tweets':
			getLastTweets();
			break;
		case 'spotify-this-song':
			getSongInfo(input);
			break;
		case 'movie-this':
			getMovieInfo(input);
			break;
		case 'do-what-it-says':
			readCommandFile();
			break;
	}
}

function getMovieInfo(search) {
	if (search.length === 0) search = 'Mr. Nobody';

	let queryType = 't';
	let queryString;
	console.log(Array.isArray(search));
	if (Array.isArray(search)) {
		//Flags have been passed
		search.forEach( (flag) => {
			if (flag.charAt(0) === '-') {
				//This is a flag
				if (flag === '-s') {
					queryType = 's';
				}
			} else {
				//This is not a flag, so must be the search string
				queryString = flag;
			}
		});		
	} else {
		queryString = search;
	}

	console.log(queryString);
	request(`http://www.omdbapi.com/?apikey=${apiKeys.omdb.key}&${queryType}=${queryString}`, function (err, response, body) {
		if (err) {
			return writeToLog(err);
		}
		body = JSON.parse(body);
		console.log(body);
		if (queryType === 't') {
			let logString = ``;
			logString += `Title: ${body.Title}\n`;
			logString += `Release Year: ${body.Year}\n`;
			body.Ratings.forEach( (rating) => {
				logString += `${rating.Source}: ${rating.Value}\n`;
			});
			logString += `Country: ${body.Country}\n`;
			logString += `Language: ${body.Language}\n`;
			logString += `Plot: ${body.Plot}\n`
			logString += `Actors: ${body.Actors}\n`;
			writeToLog(logString);
		}
	});
}

function getLastTweets() {
	twitterClient.get('statuses/home_timeline', { tweet_mode: 'extended' }, function(error, tweets, response) {
		if (error) {
			return writeToLog(error);
		}
		console.log(`********************Twitter********************`);
	
		let logString = ``;
		tweets.forEach( (tweet) => {
			logString += `${tweet.user.screen_name}\n`;
			logString += `${tweet.created_at}\n`;
			if (tweet.retweeted_status) {
				logString += `${tweet.retweeted_status.full_text}\n`;
			} else {
				logString += `${tweet.full_text}\n`;
			}
			logString += '-----------\n';
		});

		writeToLog(logString);
	});
}

function getSongInfo(song) {
	if (song.length === 0) song = 'The Sign';

	spotifyClient.search({ type: 'track', query: song }, function(err, response) {
		if (err) return writeToLog(err);

		console.log('-----Song Results-----');

		response.tracks.items.forEach( (result, index) => {
			console.log(`${index}) ${result.name} by ${result.artists[0].name}`);
		});

		console.log('Please enter number of desired track');
		process.stdin.resume();
		process.stdin.once("data", function(data) {
			let displayTrack = response.tracks.items[parseFloat(data)];
			console.log(`-----Result-----`);
			let logString = ``;
			logString += `Song: ${displayTrack.name} by ${displayTrack.artists[0].name}\n`;
			logString += `Album: ${displayTrack.album.name}\n`;
			logString += `Preview Link: ${displayTrack.href}\n`;
			writeToLog(logString);
			process.stdin.pause();
		});
	});
}

function readCommandFile() {
	lineReader.on('line', function(line) {
		let fileCommand = line.split(' ');
		let command = fileCommand[0];
		console.log('Processing:', command);
		let input = '';
		for (let i = 1; i < fileCommand.length; i++) {
			input += fileCommand[i] + ' ';
		}

		input.trim();
		processUserCommand(command, input);
	});
}

function getUserInput() {
	let input = '';
	let flags = [];

	for (let i = 3; i < process.argv.length; i++) {
		console.log(`argv:${process.argv[i]}`);
		if (process.argv[i].charAt(0) === '-') {
			flags.push(process.argv[i]);
		} else {
		input += process.argv[i] + ' ';	
		}
	}
	
	if (flags.length !== 0) {
		flags.push(input.trim());
		return flags;
	} else {
		return input;	
	}
}

function writeToLog(string) {
	console.log(string);

	logString = date.toDateString() + ' ' + date.toTimeString();
	logString += '\n' + string + '\n';
	fs.appendFile('log.txt', logString, (err) => {
		if (err) return console.log(err);
	});
}
