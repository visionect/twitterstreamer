var Twit = require('twit'),
    config = require('./config'),
    engine = require('engine.io'),
    static = require('node-static'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

var lastImage = 'visionect.jpg?' + new Date().getTime(),
    devices = {},
    currentDevice = 0;

var T = new Twit(config.auth);
var initStream = function(user_ids) {
    // Start listening to stream
    var stream = T.stream('statuses/filter', {follow: user_ids.join(), track: config.hashtags.join()});

    stream.on('tweet', function(tweet) {
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
            lastImage = images[0];
            if (Object.keys(devices).length > 0) {
                currentDevice++;
                if (currentDevice >= Object.keys(devices).length) {
                    currentDevice = 0;
                }
                devices[Object.keys(devices)[currentDevice]] = lastImage;
                eventEmitter.emit('newImage');
            }
            console.log('New image: ' + lastImage);
        }
    });
}

if (config.users.length) {
    // Get Twitter user IDs from usernames
    T.get('users/lookup', {screen_name: config.users.join()}, function(err, reply) {
        if (err) {
            console.log(err);
            return;
        }
        var user_ids = reply.map(function(user) {
            return user.id;
        });
        
        console.log('Got ids for users:', user_ids);
        initStream(user_ids);
    });
} else {
    // initialize Twitter stream without users
    initStream([]);
}

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
    socket.send(JSON.stringify(devices));
}

server.on('connection', function(socket) {
    devices[socket.id] = lastImage;
    sendImage(socket);

    eventEmitter.on('newImage', function() {
        sendImage(socket);
    });

    socket.on('close', function() {
        delete devices[socket.id];
    });
});