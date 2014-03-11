$(document).ready(function() {
    var interval = null;
    var initSocket = function() {
        var socket = new eio.Socket('ws://' + window.location.host);
        socket.on('open', function (data) {
            clearInterval(interval);
            interval = null;
            socket.on('message', function (data) {
                data = JSON.parse(data);
                $('img').attr('src', data[socket.id]);
            });
            socket.on('close', function() {
                socket.off('open message close');
                interval = setInterval(function() {
                    initSocket();
                }, 5000);
            });
        });
    }
    initSocket();
    

    $('img').load(function() {
        var $body = $('body'),
            $image =  $(this);
        if ( ($body.width() / $body.height()) < ($image.width() / $image.height()) ) {
            $image.css({
                height: '100%',
                width: 'auto'
            });
            $image.css({
                'margin-top': 0,
                'margin-left': ($body.width()-$image.width()) / 2
            });
        } else {
            $image.css({
                height: 'auto',
                width: '100%',
            });
            $image.css({
                'margin-top': ($body.height()-$image.height()) / 2,
                'margin-left': 0
            });
        }
        $('body').tmList();
    });
});