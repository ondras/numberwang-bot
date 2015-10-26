String.prototype.format = function() {
	var args = arguments;
	var count = 0;
	return this.replace(/%s/g, function(match, index, str) {
		if (str.charAt(index-1) == "%") { return match; }
		return args[count++];
	});
}

var tweets = {
	total: 0,
	count: 0
}

var replies = {
	total: 0,
	count: 0
}

var errors = {
	total: 0,
	count: 0
}

var lastTS = Date.now();

exports.addTweet = function() {
	tweets.total++;
	tweets.count++;
}

exports.addReply = function() {
	replies.total++;
	replies.count++;
}

exports.addError = function() {
	errors.total++;
	errors.count++;
}

function statsLocal() {
	var ts = Date.now();
	var tps = tweets.count * 1000 / (ts - lastTS);

	var str = "[%s] LOCAL %s tweets, %s replies, %s errors, %s tps";
	console.log(str.format(Date.now(), tweets.count, replies.count, errors.count, tps.toFixed(2)));

	lastTS = ts;
	tweets.count = 0;
	replies.count = 0;
	errors.count = 0;
}

function statsGlobal() {
	var str = "[%s] GLOBAL %s tweets, %s replies, %s errors";
	console.log(str.format(Date.now(), tweets.total, replies.total, errors.total));
}

setInterval(statsLocal, 1*60*1000);
setInterval(statsGlobal, 60*60*1000);

process.on("exit", statsGlobal);
process.on("SIGINT", process.exit);
