(function() {

    var classRoom = {
        /**
         *	About
         */
        about: {
            name: 'AMCS-MUC',
            version: '1.0'
        },
		
        /**
         *	NameSpaces
         */
        BOSH: "http://localhost/http-bind",
        //BOSH: "/http-bind",
        MUC: "http://jabber.org/protocol/muc",
        OPENFIREDOMAIN: "jabber",
        //ROOM: "test@conference.kp",
        ROOM: null,
		SLIDE: "acms:ns:slide",
		
        /**
         *	Globals
         */
        connection: null,
        nickName: null,
        joined: null, // onConnected->false; roomJoined->true
        participants: null, //Boolean Array: true - joined the room
        jid: null,
        user: null,
        pw: null,
		
		 /**
         *	functions
         */
        connect: function(data) {
            // Reset before every connection attempt to make sure reconnections work after authfail, alltabsclosed, ...
//            if (classRoom.connection !== null)
//                classRoom.connection.reset();

            var authFail = false;

            classRoom.connection.connect(data.jid, data.password,
                    function(status) {
                        if (status === Strophe.Status.CONNECTED) {
                            classRoom.connected();
                        } else if (status === Strophe.Status.DISCONNECTED) {
                            if (authFail) {
                                classRoom.register();
                            } else
                                classRoom.disconnected();
                        } else if (status === Strophe.Status.AUTHFAIL) {
                            classRoom.connection.disconnect();
                            authFail = true;
                        }
                    });
        },
		
		connected: function() {
            classRoom.joined = false;
            classRoom.participants = {};
            classRoom.Action.PresencePriority('-1');
            classRoom.Utils.registerHandlers();
            classRoom.Action.Presence(classRoom.nickName);
			
            $('#create_room').hide();
            $('#connect_room').hide();
            $('#page').show();
        },
		
		disconnected: function() {
            classRoom.connection = null;

            $('#memberList').empty();
            $('#chatContainer').empty();
            $('#user').empty();
            $('#page').hide();
            $('#create_room').show();
            $('#connect_room').show();
        },
			
		register: function() {
            var callback = function(status) {
                console.log("status: " + status);
                if (status === Strophe.Status.REGISTER) {
                    classRoom.connection.register.fields.username = classRoom.user;
                    classRoom.connection.register.fields.password = classRoom.pw;
                    classRoom.connection.register.submit();
                } else if (status === Strophe.Status.REGISTERED) {
                    console.log("registered!");
                    //classRoom.connection.register.authenticate();
                    classRoom.connection.disconnect();
                } else if (status === Strophe.Status.CONNECTED) {
                    console.log("logged in!");
                } else if (status === Strophe.Status.DISCONNECTED) {
                    //$(document).trigger('connect');
                    classRoom.connect({jid: classRoom.jid, password: classRoom.pw});
                } else {
                    console.log("status: " + status);
                }
            };
            classRoom.connection.register.connect(classRoom.jid, callback);
        },
		
		 /**
         *	object
         *
         *
         *
         */
		FeedBack: {
			actualSlide: 1,
			slideCount: 4,
			
			handleSlideChange: function() {
				var count = classRoom.FeedBack.slideCount;
                var actualSlide = classRoom.FeedBack.actualSlide.toString();
                var time = classRoom.Utils.time();

                $('#slideStatus').text(actualSlide + ' / ' + count);
                classRoom.FeedBack.enableItems();

                classRoom.Action.SlideChange(actualSlide, time);
            },
			
            setSlideStatus: function() {
                var count = classRoom.FeedBack.slideCount;
                $('#slideStatus').text(classRoom.FeedBack.actualSlide + ' / ' + count);
            },
		},
		 /**
         *	object with helper functions
         *
         *
         *
         */
        Utils: {
            /**
             *	function: adding new lines at the bottom and fix scrollbar position
             */
            addMessage: function(message) {
                var chatContainer = $('#chatContainer').get(0);
                var bool_bottom = chatContainer.scrollTop >= chatContainer.scrollHeight - chatContainer.clientHeight;

                $('#chatContainer').append(message);

                if (bool_bottom) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            },
			
			/**
             *	function: returns time
             */
            time: function() {
                date = new Date();

                hour = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
                minute = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
                second = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

                return  hour + ':' + minute + ':' + second;

            },
			
            /** Function: addHandler
             * Wrapper for Strophe.Connection.addHandler() to add a stanza handler for the connection.
             *
             * Parameters:
             *   (Function) handler - The user callback.
             *   (String) ns - The namespace to match.
             *   (String) name - The stanza name to match.
             *   (String) type - The stanza type attribute to match.
             *   (String) id - The stanza id attribute to match.
             *   (String) from - The stanza from attribute to match.
             *   (String) options - The handler options
             *
             * Returns:
             *   A reference to the handler that can be used to remove it.
             */
            addHandler: function(handler, ns, name, type, id, from, options) {
                return classRoom.connection.addHandler(handler, ns, name, type, id, from, options);
            },
			
			registerHandlers: function() {
                classRoom.Utils.addHandler(classRoom.Handler.onPresence, null, 'presence');
                classRoom.Utils.addHandler(classRoom.Handler.onPublicMessage, null, 'message', 'groupchat');
                classRoom.Utils.addHandler(classRoom.Handler.onPrivateMessage, null, 'message', 'chat');
                classRoom.Utils.addHandler(classRoom.Handler.onSlideChange, classRoom.SLIDE, 'message', 'groupchat');
                classRoom.Utils.addHandler(classRoom.Handler.configRoom, Strophe.NS.Client, 'message', 'groupchat', '', classRoom.ROOM);
            }
        },
		
		/**
         *	object containing all stanzas being sent to the jabber host
         *
         *
         *
         */
        Action: {
            PresencePriority: function(index) {
                classRoom.connection.send($pres().c('priority').t(index));
            },
			
            Presence: function(name) {
                classRoom.connection.send($pres({to: classRoom.ROOM + '/'
                            + name}).c('x', {xmlns: classRoom.MUC}))
            },
			
            Disconnect: function(name) {
                classRoom.connection.send($pres({to: classRoom.ROOM + '/' + name,
                    type: "unavailable"
                }));
            },
			
            PublicMessage: function(text, time) {
                classRoom.connection.send($msg({to: classRoom.ROOM, type: 'groupchat'})
                        .c('body').t(text)
                        .up()
                        .c('time', time));
            },
			
            PrivateMessage: function(text, time, nick) {
                classRoom.connection.send($msg({to: classRoom.ROOM + '/' + nick, type: 'chat'})
                        .c('body').t(text)
                        .up()
                        .c('time', time));
            },
			
            SlideChange: function(actualSlide, time) {
                classRoom.connection.send($msg({to: classRoom.ROOM, type: 'groupchat'})
                        .c('body').t('AKTUELLER SLIDE: ' + actualSlide)
                        .up()
                        .c('time', time)
                        .up()
                        .c('feedback', {xmlns: classRoom.SLIDE})
                        .c('slide', actualSlide));
            },

            sendConfig: function(msg) {
                console.log("sendConfig");
                var msg = $(msg);
                var fields = msg.find('field');
                classRoom.connection.muc.saveConfiguration(classRoom.ROOM, fields);
            }

        },
		
		 /**
         *	object containing all handlers reacting on Strophe
         *
         *
         *
         */
        Handler: {
            /**
             *	function: populate member area, nickname conflict, handle own presence, set joined
             */
            onPresence: function(presence) {
                var from = $(presence).attr('from');
                var nick = Strophe.getResourceFromJid(from);

                /*if theres no error, user is available and user has not joined the room yet set add
                 the user to participants*/
                if ($(presence).attr('type') === 'error' && !classRoom.joined) {
                    classRoom.connection.disconnect();
                    //alert('error');
                }
                else
                if (!classRoom.participants[nick] && $(presence).attr('type') !== 'unavailable') {
                    classRoom.participants[nick] = true;
                    /*now that the user has joined watch up for adding to list or to avatar*/
                    if (nick === classRoom.nickName) {
                        $('#avatar').text(nick);
                    }
                    else {
                        $('#memberList').append("<li id='" + nick + "'>" + "<div class='member'>"
                                + "<div class='image'><img src='img/member.png' alt='pic'></div>"
                                + "<div class='nick'>" + nick + "</div></li>");
                    }

                }
                else
                /*user leaves the room, remove him from list*/
                if (classRoom.participants[nick] && $(presence).attr('type') === 'unavailable') {
                    $('#memberList li').each(function() {
                        if (nick === $(this).attr('id')) {
                            $(this).remove();
                            return false;
                        }
                    });
                }

                /*handle own presence, nick changed?*/
                if ($(presence).attr('type') !== 'error' && !classRoom.joined) {

                    if ($(presence).find("status[code ='110']").length > 0) {
                        if ($(presence).find("status[code ='210']").length > 0) {
                            classRoom.nickName = Strophe.getResourceFromJid(from);
                        }
                    }
                    else {
                        classRoom.joined = true;
                        classRoom.FeedBack.setSlideStatus();
                    }
                }

                return true;
            },
			
            /**
             *	function: populate chat messages and also feedback messages (hidden)
             */
            onPublicMessage: function(message) {
                var from = $(message).attr('from')

                var nick = Strophe.getResourceFromJid(from);

                if (nick === null)
                    nick = "Server";

                var text = $(message).children('body').text();
                var time = $(message).children('time').text();

                if ($(message).find('feedback').length > 0) {
                    classRoom.Utils.addMessage("<div class='message hidden'>"
                            + "<div class='head'>" + time + " | " + nick + ":" + "</div>"
                            + "<div class='body'>" + text + "</div></div>");
                    return true;
                }
                else
                if ($(message).find('body').length > 0) {
                    classRoom.Utils.addMessage("<div class='message'>"
                            + "<div class='head'>" + time + " | " + nick + ":" + "</div>"
                            + "<div class='body'>" + text + "</div></div>");
                }
                return true;
            },
			
            /**
             *	function: populate private chat messages
             */
            onPrivateMessage: function(message) {
                var from = $(message).attr('from')
                var nick = Strophe.getResourceFromJid(from);

                var text = $(message).children('body').text();
                var time = $(message).children('time').text();

                classRoom.Utils.addMessage("<div class='message private'>" +
                        "<div class='head'>" + time + " | " + nick + ":" + "</div>" +
                        "<div class='body'>" + text + "</div></div>");
                return true;
            },
			
			 /**
             *	function: sets actualSlide, updates View, enables FeedBackItems
             */
            onSlideChange: function(message) {
                var sSlide;

                if ($(message).find('feedback').length > 0) {
                    $(message).find('feedback > slide').each(function() {
                        sSlide = $(this).text();
                    });
                }

                var actualSlide = +sSlide;
                classRoom.FeedBack.actualSlide = actualSlide;

				classRoom.FeedBack.setSlideStatus();
                return true;
            },
            
            configRoom: function() {
                console.log("handler configRoom works");
                classRoom.connection.muc.configure(classRoom.ROOM, classRoom.Action.sendConfig);
            }
		},
		
		 View: {
            showLoginBox: function(style) {
                if (style === "connect") {
                    console.log("showLoginBox connect");
                    $("#login_user").hide();
                    $("#login_pw").hide();
                } else if (style === "create") {
                    $("#login_user").show();
                    $("#login_pw").show();
                    console.log("showLoginBox create");
                } else {
                    console.log("showLoginBox else");
                    $(".ui-dialog-titlebar-close").hide();
                    $(".ui-dialog-titlebar").css({'background': '#3B5998', border: '0'});
                }
                $('#loginDialog').dialog({
                    autoOpen: true,
                    draggable: false,
                    modal: true,
                    resizable: false,
                    open: function() {
//                        $(".ui-dialog-titlebar-close").hide();
							$(".ui-dialog-titlebar").css({'background': '#3B5998', border: '0'});
                    },
                    title: 'LOGIN',
                    buttons: {
                        'Enter': function()
                        {
                            classRoom.nickName = $('#nickname').val();
                            if (style === "create") {
                                classRoom.jid = $('#jid').val() + "@" + classRoom.OPENFIREDOMAIN;
                                classRoom.pw = $('#password').val();

                            } else if (style === "connect") {
                                $.ajax({
                                    url: 'userinformation.json',
                                    dataType: 'json',
                                    async: false,
                                    //data: myData,
                                    success: function(data) {
                                        classRoom.user = data.user;
                                        classRoom.pw = data.pw;
                                        classRoom.jid = data.user + "@" + classRoom.OPENFIREDOMAIN;
                                    }
                                });
                            }

                            classRoom.connection = new Strophe.Connection(classRoom.BOSH);
                            classRoom.connect({jid: classRoom.jid, password: classRoom.pw});

                            $('#password').val('');
                            $(this).dialog('close');
                        }
                    },
					
                    focus: function() {
                        $(':input', this).keyup(function(event) {
                            if (event.keyCode == 13) {
                                $('.ui-dialog-buttonpane button:first').click();
                            }
                        });
                    }
                });
            }
        },
		
	
	};
	
	 /**
     *
     *
     *jQuery ready >>>>> TODO: remove
     *
     *
     *
     */
	$(document).ready(function() {
		$('#page').hide();
        classRoom.ROOM = document.title.toLowerCase() + "@conference." + classRoom.OPENFIREDOMAIN;
        classRoom.ROOM = "test" + "@conference." + classRoom.OPENFIREDOMAIN;
    });
	
	 /**
     *
     *
     *jQuery Event Handlers
     *
     *
     *
     */
	 
	 $(document).on('click', '#disconnect', function() {
        classRoom.Action.Disconnect(classRoom.nickName);
        classRoom.connection.disconnect();
    });
	
	$(document).on('keypress', '#input', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            var text = $(this).val();
            var time = classRoom.Utils.time();
            classRoom.Action.PublicMessage(text, time);
            $(this).val('');
        }
    });
	
	$(document).on('click', 'ul#memberList li div.member', function(e) {
		e.preventDefault();
		var nick = $(this).parent().attr('id');

		$('#pmDialog').dialog({
			autoOpen: true,
			draggable: true,
			modal: false,
			resizable: true,
			title: 'PM to: ' + nick,
			open: function() {
				$(".ui-dialog-titlebar").css({'background': '#3B5998', border: '0'});
			},
			buttons: {
				'SEND': function() {
					var text = $('#pmMessage').val();
					var time = classRoom.Utils.time();
					classRoom.Action.PrivateMessage(text, time, nick);
					$('#pmMessage').val('');
					$(this).dialog('close');
				}
			}
		});
	});
	 
	$(document).on('click', '#create_room', function() {
        classRoom.View.showLoginBox("create");
    });
	
    $(document).on('click', '#connect_room', function() {
        classRoom.View.showLoginBox("connect");
    });
	
}());	
		