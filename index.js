var Twit = require('twit'),
    config = require('./config'),
    engine = require('engine.io'),
    static = require('node-static'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

var lastImage = {};

// Get Twitter user IDs from usernames
var T = new Twit(config.auth);
T.get('users/lookup', {screen_name: config.users.join()}, function(err, reply) {
    if (err) {
        console.log(err);
        return;
    }
    var user_ids = reply.map(function(user) {
        return user.id;
    });
    
    console.log('Got ids for users:', user_ids);

    // Start listening to stream
    var stream = T.stream('statuses/filter', {follow: user_ids.join(), track: config.hashtags.join()}),
        hashtagregex = new RegExp(config.hashtags.join('|'));

    stream.on('tweet', function(tweet) {
        if (user_ids.indexOf(tweet.user.id) != -1 && hashtagregex.test(tweet.text)) {
            var images = [];
            if ('media' in tweet.entities) {
                images = tweet.entities.media.filter(function(media) {
                    return media.type == 'photo';
                }).map(function(media) {
                    return media.media_url;
                });
            } else if ('urls' in tweet.entities) {
                images = tweet.entities.urls.filter(function(url) {
                    return url.expanded_url.indexOf('instagr') != -1;
                }).map(function(url) {
                    return url.expanded_url + 'media?size=l';
                });
            }
            if (images.length > 0) {
                console.log(tweet, images[0]);
                eventEmitter.emit('newImage');
            }
        }
    });
});

// Create static files server
var fileServer = new static.Server('./public');
var http = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(config.server_port);
console.log('Started server on port %d. Open http://127.0.0.1:%d in your browser.', config.server_port, config.server_port);

// Attach engine.io to http server
var server = engine.attach(http);

var sendImage = function(socket) {
    socket.send(JSON.stringify(lastImage));
}

server.on('connection', function(socket) {
    sendImage(socket);
    eventEmitter.on('newImage', function() {
        sendImage(socket);
    });
});
