var Twitter = require("twitter");

var client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var DELAY = 5*60*1000;
var tokens = ["54", "47", "4"];
var splitRE = /\s+/;
var recentlyReplied = {};

function onError(error, response) {
	console.error("!!!", error, response.headers);
}

function onReplied(err, tweet, response) {
	if (err) { 
		onError(err, response);
	} else {
		console.log("Successfully sent tweet", tweet.id_str);
	}
}

function sendReply(tweet) {
	var users = tweet.entities.user_mentions.map(function(user) {
		return user.screen_name;
	});

	var name = tweet.user.screen_name;
	recentlyReplied[name] = 1;
	if (users.indexOf(name) == -1) { users.unshift(name); }

	var text = "That's Numberwang! https://www.youtube.com/watch?v=qjOZtWZ56lc";
	text = users.map(function(user) { return "@" + user; }).join(" ") + " " + text;

	var data = {
		status: text,
		in_reply_to_status_id: tweet.id_str
	}
	client.post("statuses/update", data, onReplied);
}

function testTweet(tweet) {
	if (tweet.retweeted_status) { return false; }
	if (tweet.user.screen_name in recentlyReplied) { return false; }

	var words = tweet.text.split(splitRE);
	for (var i=0;i<words.length;i++) {
		var word = words[i];
		var ch = word.charAt(0);
		if (ch == "@" || ch == "#") { continue; } // mentions, hashtags are okay
		if (tokens.indexOf(word.toLowerCase()) > -1) { continue; } // found token

		return false; // anything else => filter out
	}

	return true;
}

function onTweets(tweets) {
	available = tweets.filter(testTweet);
	console.log("Search found", tweets.length, "tweets,", available.length, "of them passed the filter");
	if (available.length) { sendReply(available[0]); }
}

function search() {
	var hours = new Date().getHours();

	if (hours >= 6) {
		client.get("search/tweets", {q:tokens.join(" OR "), result_type:"recent", count:"100"}, function(err, data, response) {
			if (err) {
				onError(err, response);
			} else {
				onTweets(data.statuses);
			}
		});
	}

	setTimeout(search, DELAY);
}

client.get("statuses/home_timeline", {count:"100", trim_user:"true", include_entities:"false"}, function(err, data, response) {
	if (err) {
		onError(err, response);
	} else {
		data.forEach(function(tweet) {
			recentlyReplied[tweet.in_reply_to_screen_name] = 1;
		});
		console.log("Recently replied to", Object.keys(recentlyReplied).length, "users");
		search();
	}
});
