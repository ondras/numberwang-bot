var stats = require("./stats");
var Twitter = require("twitter");

var client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var tokens = ["54", "47"];
var splitRE = /\s+/;

var onReplied = function(err, tweet) {
	if (err) { 
		onError(err);
	} else {
		stats.addReply();
		console.log("Successfully sent tweet", tweet.id_str);
	}
}

var sendReply = function(tweet) {
	var users = tweet.entities.user_mentions.map(function(user) {
		return user.screen_name;
	});

	var name = tweet.user.screen_name;
	if (users.indexOf(name) == -1) { users.unshift(name); }

	var text = "That's Numberwang! https://www.youtube.com/watch?v=qjOZtWZ56lc";
	text = users.map(function(user) { return "@" + user; }).join(" ") + " " + text;

	var data = {
		status: text,
		in_reply_to_status_id: tweet.id_str
	}
	client.post("statuses/update", data, onReplied);
}

var onTweet = function(tweet) {
	if (tweet.limit) {
		console.log("!!! Tracking limit:", tweet.limit.track);
		return;
	}

	stats.addTweet();

	var words = tweet.text.split(splitRE);
	for (var i=0;i<words.length;i++) {
		var word = words[i];
		var ch = word.charAt(0);
		if (ch == "@" || ch == "#") { continue; } // mentions, hashtags are okay
		if (tokens.indexOf(word.toLowerCase()) > -1) { continue; } // found token

		return; // anything else => filter out
	}

	sendReply(tweet);
}

var onError = function(error) {
	stats.addError();
	console.error("!!!", error);
}

client.stream("statuses/filter", {track:tokens.join(","), filter_level:"none"}, function(stream) {
	stream.on("data", onTweet);
	stream.on("error", onError);
});
