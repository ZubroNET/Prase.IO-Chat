// Vycraftoval Zubrofyl
// 19.5.2K17
// v1.0.0
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3001; 
server.listen(port, function () {
  console.log('Server jede na portu %d', port);
});
app.use(express.static(__dirname + '/public'));
var numUsers = 0;
io.on('connection', function (socket) {
  var addedUser = false;
  socket.on('new message', function (data) {
  console.log('Někdo napsal: ',data);
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
     });
  });
  socket.on('add user', function (username) {
    if (addedUser) return;
    console.log('Připojil se nový uživatel: ',username);
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
