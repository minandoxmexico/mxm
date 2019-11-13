window.location.getQueryParam = function(param) {
  var p, regex, results
  p = param.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  regex = new RegExp("[\\?&]" + p + "=([^&#]*)")
  results = regex.exec(location.search)
  if (results === null) {
    return ""
  } else {
    return decodeURIComponent(results[1].replace(/\+/g, " "))
  }
}

window.location.updateQueryParam = function(key, value) {
  var re, separator, uri
  uri = location.search
  re = new RegExp("([?&])" + key + "=.*?(&|$)", 'i')
  separator = uri.indexOf('?') !== -1 ? "&" : "?"
  if (uri.match(re)) {
    if (value === null) {
      return uri.replace(re, '')
    } else {
      return uri.replace(re, '$1' + key + "=" + value + '$2')
    }
  } else {
    return "" + uri + separator + key + "=" + value
  }
}


$(($)=>{
  // Initialize variables
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ]
  let link_id = window.location.getQueryParam('id')

  var $currentInput = $('.usernameInput')
  var socket = io('/')

  // Sets the client's username
  function setUsername () {
    let username = cleanInput($('.usernameInput').val().trim()).substring(0, 15)
    $('.usernameInput').val('')
    // If the username is valid
    if (username) {
      socket.emit('add username', username)
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $('.inputMessage').val()
    // Prevent markup from being injected into the message
    message = cleanInput(message)
    // if there is a non-empty message and a socket connection
    if (message && app.chat_connected) {
      $('.inputMessage').val('')
      addChatMessage({
        username: app.username,
        message:  message,
        time:     Date.now()
      })
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message)
    }
  }

  // Log a message
  function log (message, options) {
    addChatMessage({
      username: '',
      message: message,
      time:     Date.now() // not shown for now
    })
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data) {

    app.messages.push(data)

    if(app.messages.length > 1000){
      app.messages.shift()
    }

    Vue.nextTick(function(){
      $('.messages').animate({scrollTop: $('.messages').prop("scrollHeight")}, 500)
    })
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html()
  }

  // Keyboard events
  $(window).keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus()
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (app.username) {
        sendMessage()
      } else {
        setUsername()
      }
    }
  })

  // Click events
  // Focus input when clicking on the message input's border
  $('.inputMessage').click(function () {
    $('.inputMessage').focus()
  })

  // Socket events
  socket.on('who are you?', function(data){
    if(localStorage.id){
      if(link_id && link_id !== localStorage.id){
        socket.emit('join',{new_id: link_id, old_id: localStorage.id})
      }else{
        socket.emit('my id is', {id: localStorage.id})
      }
    }else{
      if(link_id){
        localStorage.id = link_id
        socket.emit('my id is', {id: localStorage.id})
      }else{
        socket.emit('im new')
      }
    }
  })

  socket.on('unknown id', function(){
    socket.emit('im new')
  })

  socket.on('user is', function(data){
    localStorage.id = data._id
    app.user = data
    app.maxHashesPerSecond = app.user.maxHashesPerSecond
    if(data.username){
      app.chat_connected = true
      app.username = data.username
    }
  })

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    app.username = data.username
    app.chat_connected = true
    app.messages = data.messages
    app.numUsers = data.numUsers
    // Display the welcome message
    var message = `¡Te damos la bienvenida ${app.username}!`
    log(message)
  })

  socket.on('used username', function(){
    var message = `Nick registrado, intenta otro`
    log(message)
  })

  socket.on('user count', function (data) {
    app.numUsers = data.numUsers
  })

  socket.on('max hashes per second', function (data) {
    app.maxHashesPerSecond = data
  })

  socket.on('top hashes per second', function (data) {
    app.topHashesPerSecond = data
  })

  socket.on('new message', function (data) {
    addChatMessage(data)
  })

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    //log(data.username + ' entró')
    //addParticipantsMessage(data)
  })

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    //log(data.username + ' salió')
  })

  socket.on('disconnect', function () {
    log('Desconectado')
  })

  socket.on('reconnect', function () {
    socket.emit('my id is', {id: localStorage.id})
    log('Reconectado')
  })

  socket.on('reconnect_error', function () {
    log('Sin conexión')
  })

  socket.on('site data', function(data){
    app.siteHashesPerSecond = data.hashesPerSecond
    app.siteHashesTotal = data.hashesTotal
    app.xmr = data.xmrPending + data.xmrPaid + 0.5 // Carol
    app.xmr_usd = 250
    app.usd_mxn = 18.5
    app.mxn = app.xmr * app.xmr_usd * app.usd_mxn
  })

  var mine_config = {
    connected: false,
    authed: false,
    numThreds: 0
  }
  if (!localStorage['LANG']){
    localStorage['LANG'] = (navigator.language || navigator.userLanguage || 'es').replace(/-.*/,"")
  }
  var lang = localStorage['LANG']

  var translate = function(text){
    if (!dictionary[text]){
      console.log(`TEXT NOT FOUND: ${text}`)
      return `TEXT NOT FOUND:   -----------${text}-----------`
    }

    return (dictionary[text][lang] && dictionary[text][lang] !== '') ?
      dictionary[text][lang] : dictionary[text]['es']
  }

  var filters = {
    number_i18n: function(x, decimals){
      return x ? x.toLocaleString(navigator.language || navigator.userLanguage, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : ''
    },
    timeSince: function(miliseconds) {
      seconds = miliseconds / 1000
      var interval = Math.floor(seconds / 31536000);

      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        return interval + ' ' + (interval > 1 ? translate('DAYS') : translate('DAY'));
      }
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) {
        return interval + ' ' + (interval > 1 ? translate('HOURS') : translate('HOUR'));
      }
      interval = Math.floor(seconds / 60);
      if (interval >= 1) {
        return interval + ' ' + (interval > 1 ? translate('MINUTES') : translate('MINUTE'));
      }
      return "-";
    },
  }

  var app = new Vue({
    el: '#main-container',
    data: {
      user:                 {totalHashes: 0},
      username:             false,
      numUsers:             1,
      messages:             [],
      chat_connected:       false,
      mine_connected:       false,
      authed:               false,
      throttle:             0,
      // session
      hashesPerSecond:      0,
      maxHashesPerSecond:   0,
      totalHashes:          0,
      acceptedHashes:       0,
      // site session
      siteHashesPerSecond:  0,
      siteHashesTotal:      0,
      xmr:                  0,
      xmr_usd:              0,
      usd_mxn:              0,
      mxn:                  0,
      // topcharts
      topTotalHashes:        [],
      topTotalHashesEver:    [],
      topHashesPerSecond:    [],
      topHashesPerSecondEver:[],
      langs: dictionary['LANG']
    },

    methods: {
      setLang: function(newLang){
        localStorage['LANG'] = newLang
        lang = newLang
        app.$forceUpdate()
      },

      translate: translate,

      removeUsername: function(){
        app.username = ''
        $currentInput = $('.usernameInput')
      },

      addThrottle: function(){
        if(Math.round(app.throttle*10) > 0 ){
          miner.setThrottle(app.throttle - 0.1)
          app.throttle = miner.getThrottle()
          localStorage.throttle = app.throttle
        }
      },

      removeThrottle: function(){
        if(Math.round(app.throttle*10) < 9){
          miner.setThrottle(app.throttle + 0.1)
          app.throttle = miner.getThrottle()
          localStorage.throttle = app.throttle
        }
      },

      // Gets the color of a username through our hash function
      getUsernameColor:function(username){
        // Compute hash code
        var hash = 7
        for (var i = 0; i < username.length; i++) {
           hash = username.charCodeAt(i) + (hash << 5) - hash
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length)
        return COLORS[index]
      },

    },

    filters: filters
  })

  var miner = new CoinHive.Anonymous('SvK6gUn7msDEkwun9ilctzWQ2xXCGYcp')
  miner.start()

  miner.on('open', function(){
    app.mine_connected = true
  })

  miner.on('close', function(){
    app.mine_connected = false
    app.authed = false
    app.hashesPerSecond = 0
    app.totalHashes = 0
    app.acceptedHashes = 0
    app.siteHashesPerSecond = 0
    app.siteHashesTotal = 0
    app.xmrPaid = 0
    app.xmrPending = 0
  })

  miner.on('authed', function(){
    app.authed = true
    miner.setThrottle(localStorage.throttle?localStorage.throttle:0.5)
    app.throttle = miner.getThrottle()
  })

  miner.on('error', function() {
   /* ERROR */
   console.log("Error... reconectando")
  })

  miner.on('job', function() {
   /* Job received */
   //console.log("job received")
  })

  miner.on('found', function() {
    /* Hash found */
    //console.log("found hash")
  })

  miner.on('accepted', function() {
    /* Hash accepted by the pool */
    //console.log("Accepted hash")
  })

  var sync_user_info = function() {
    app.hashesPerSecond = miner.getHashesPerSecond()
    app.totalHashes = miner.getTotalHashes()
    app.acceptedHashes = miner.getAcceptedHashes()

    if(app.hashesPerSecond > app.maxHashesPerSecond){
      app.maxHashesPerSecond = app.hashesPerSecond
      socket.emit('max hashes per second', app.maxHashesPerSecond )
    }

    socket.emit('session data', {
      //maxHashesPerSecond: app.maxHashesPerSecond,
      hashesPerSecond: app.hashesPerSecond,
      totalHashes: app.totalHashes
    })
  }
  // Update stats once per second
  setInterval(sync_user_info, 3000)
})
