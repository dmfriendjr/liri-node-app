require("dotenv").config();
let Twitter = require('twitter');
let Spotify = require('node-spotify-api');
let request = require('request');
let inquirer = require('inquirer');
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
		case '-h':
			displayHelp();
			break;
		default:
			writeToLog('Invalid command. Use -h for command help.');
			break;
	}
}

function displayHelp() {
	console.log('\nAvailable commands:');
	console.log('my-tweets: Displays last twenty tweets by you or those you are following');
	console.log('spotify-this-song <song-name>: Searches given song name on spotify and provides list of results, with details about your selection');
	console.log('movie-this <movie-name>: Finds movie in OMDb API that matches title exactly and provides details')
	console.log('		Options: -search -s Provides a list of search results that match title name and provides details on selection');
	console.log('do-what-it-says: Looks for a random.txt file in directory where this file is located and runs any commands contained on each line of the file\n');
}

function getMovieInfo(search) {
	if (search.length === 0) search = 'Mr. Nobody';

	let queryType = 't';
	let queryString;

	if (Array.isArray(search)) {
		//Flags have been passed
		search.forEach( (flag) => {
			if (flag.charAt(0) === '-') {
				//This is a flag
				if (flag === '-s' || flag === '-search') {
					queryType = 's';
				} else if (flag === '-h' || flag === '-help') {
					console.log(`Use of -search (-s) flag will provide a list of search results for the title given. Otherwise will find closest exact title match`);
				}

			} else {
				//This is not a flag, so must be the search string
				queryString = flag;
			}
		});		
	} else {
		queryString = search;
	}
	if (queryString.length === 0) {
		return;
	}

	request(`http://www.omdbapi.com/?apikey=${apiKeys.omdb.key}&${queryType}=${queryString}`, function (err, response, body) {
		if (err) {
			return writeToLog(err);
		}
		console.log('********************OMDb**********');
		body = JSON.parse(body);
		if (queryType === 't') {
			logMovie(body);
		} else {
			//Need to display results of movie search and let user pick
			let resultsList = [];
			body.Search.forEach( (movie, index) => {
				resultsList.push(`${movie.Title} (${movie.Type})`);
			});

			inquirer.prompt([
				{
					type: 'list',
					message: 'Please pick the movie you are looking for',
					choices: resultsList,
					name: 'movieChoice'
				}
			]).then( (inquirerResponse) => {
				let selectedIndex = resultsList.indexOf(inquirerResponse.movieChoice)
				//Full movie details not returned in search API, have to do title search to get detailed information
				request(
					`http://www.omdbapi.com/?apikey=${apiKeys.omdb.key}&t=${body.Search[selectedIndex].Title}&type=${body.Search[selectedIndex].Type}`,
					(err, response,body) => {
						logMovie(JSON.parse(body));
					});
			});
		}
	});
}

function logMovie(movie) {
	let logString = '';
	logString += `Title: ${movie.Title}\n`;
	logString += `Release Year: ${movie.Year}\n`;
	movie.Ratings.forEach( (rating) => {
		logString += `${rating.Source}: ${rating.Value}\n`;
	});
	logString += `Country: ${movie.Country}\n`;
	logString += `Language: ${movie.Language}\n`;
	logString += `Plot: ${movie.Plot}\n`
	logString += `Actors: ${movie.Actors}\n`;
	writeToLog(logString);
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

		let resultsList = [];
		response.tracks.items.forEach( (result, index) => {
			resultsList.push(`${result.name} by ${result.artists[0].name}`);
		});

		inquirer.prompt([
			{
				type: 'list',
				message: 'Please pick desired song',
				choices: resultsList,
				name: 'songChoice'
			}
		]).then( (inquirerResponse) => {
			let logString = ``;
			let	displayTrack = response.tracks.items[resultsList.indexOf(inquirerResponse.songChoice)]; 
			logString += `Song: ${displayTrack.name} by ${displayTrack.artists[0].name}\n`;
			logString += `Album: ${displayTrack.album.name}\n`;
			logString += `Preview Link: ${displayTrack.href}\n`;
			writeToLog(logString);
		});
	});
}

function readCommandFile() {
	lineReader.on('line', function(line) {
		let fileCommand = line.split(' ');
		let command = fileCommand[0];
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
