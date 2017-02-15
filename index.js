"use strict";

const TOKENS = ["54", "47", "4"];
const SPLIT = /\s+/;
const YOUTUBE_URL = "https://www.youtube.com/watch?v=qjOZtWZ56lc";
const SEARCH_DELAY = 5*60*1000; // for periodic searches
const SEND_DELAY = 10*1000;     // for stream-based quoting

const Twitter = require("twitter");
let client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

process.on("unhandledRejection", (reason, p) => {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

function sendReply(tweet) {
	console.log("Quoting %s ('%s')", tweet.id_str, tweet.text);

	let attachment_url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
	let params = {
		status: `That's Numberwang! ${YOUTUBE_URL}#${Math.random()}`,
		attachment_url
	}
	client.post("statuses/update", params).then(
		tweet => console.log("Successfully sent tweet %s", tweet.id_str),
		console.error
	);
}

function testWord(word) {
	return (TOKENS.indexOf(word.toLowerCase()) > -1);
}

function isRegularWord(word) {
	let ch = word.charAt(0);
	return (ch != "@" && ch != "#");
}

function testTweet(tweet) {
	if (tweet.retweeted_status) { return false; }

	let words = tweet.text.split(SPLIT);
	let regular = words.filter(isRegularWord);

	return regular.length > 0 && regular.every(testWord);
}

function onTweets(tweets) {
	let available = tweets.filter(testTweet);
	console.log("Search found %s tweets, %s of them passed the filter", tweets.length, available.length);
	if (available.length) { sendReply(available[0]); }
}

function search() {
	let hours = new Date().getHours();

	if (hours >= 6) {
		let params = {
			q: TOKENS.join(" OR "),
			result_type: "recent",
			count: 100
		}
		client.get("search/tweets", params).then(data => onTweets(data.statuses), console.error);
	}

	setTimeout(search, SEARCH_DELAY);
}

if (SEARCH_DELAY > 0) {
	search();
} else {
	console.log("Opening search stream");
	let stream = client.stream('statuses/filter', {track: TOKENS.join(",")})
	stream.on("data", tweet => {
		if (!tweet.text) { return; }
		if (!testTweet(tweet)) { return; }
		setTimeout(() => sendReply(tweet), SEND_DELAY);
	});
	stream.on("error", console.error);
}
