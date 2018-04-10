$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var socket = io();
  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "je tady 1 prase";      
    }  else if (data.numUsers === 2) {
      message += "jsou tady 2 prasata"; 
    }  else if (data.numUsers === 3) {
      message += "jsou tady 3 prasata"; 
    }  else if (data.numUsers === 4) {
      message += "jsou tady 4 prasata"; 
    }  else {
      message += "je tady " + data.numUsers + " prasat";
    }
    log(message);
  }
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      socket.emit('add user', username);
    }
  }
  function sendMessage () {
    var message = $inputMessage.val();
    message = cleanInput(message);
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      socket.emit('new message', message);
    }
  }
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }
  function addChatMessage (data, options) {
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);
    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);
    addMessageElement($messageDiv, options);
  }
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'píše';
    addChatMessage(data);
  }
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }
  function addMessageElement (el, options) {
    var $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();
      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }
  function getUsernameColor (username) {
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }
  $window.keydown(function (event) {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });
  $inputMessage.on('input', function() {
    updateTyping();
  });
  $loginPage.click(function () {
    $currentInput.focus();
  });
  $inputMessage.click(function () {
    $inputMessage.focus();
  });
  socket.on('login', function (data) {
    connected = true;
    var message = "Vítejte na PRASE.IO chatu že - ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });
  socket.on('new message', function (data) {
    addChatMessage(data);
  });
  socket.on('user joined', function (data) {
    log(data.username + ' se připojil');
    addParticipantsMessage(data);
  });
  socket.on('user left', function (data) {
    log(data.username + ' nás opustil');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });
  socket.on('typing', function (data) {
    addChatTyping(data);
  });
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });
  socket.on('disconnect', function () {
    log('byl jsi odpojen, fakt ty nulo jdi se zabít');
  });
  socket.on('reconnect', function () {
    log('omg funguje to zase jsi online');
    if (username) {
      socket.emit('add user', username);
    }
  });
  socket.on('reconnect_error', function () {
    log('pokus o připojení selhal, restartuje prosím router');
  });
});
