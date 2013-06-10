(function(){

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
	MUC:  "http://jabber.org/protocol/muc",
	OPENFIREDOMAIN: "jabber",
	ROOM: "raum1@conference.jabber",
	FEEDBACK: "acms:ns:instantFeedback",
	SLIDE: "acms:ns:slide",
	
	
	/**
	*	Globals
	*/
	connection: null,
	nickName: null,
	joined: null, // onConnected->false; roomJoined->true
	participants: null,  //Boolean Array: true - joined the room
	
	
	/**
	*	functions
	*/
	
	connect: function (data) { 	
				classRoom.connection = new Strophe.Connection(classRoom.BOSH);
				classRoom.connection.connect(data.jid, data.password, 
												function (status) {
													if (status === Strophe.Status.CONNECTED) {
														classRoom.connected();
													}
													else if (status === Strophe.Status.DISCONNECTED) {
														classRoom.disconnected();
													}
												});							
	},
	
	connected: function () {
				classRoom.joined = false;
				classRoom.SlideShow.setSlideShow(3);
				classRoom.participants = {};
				classRoom.connection.send( $pres().c('priority').t('-1') );
				classRoom.Utils.registerHandlers();
				classRoom.connection.send( $pres({ to: classRoom.ROOM + '/' 
										   + classRoom.nickName }).c('x' , {xmlns: classRoom.MUC}));
				$('#page').show();
	},
	
	disconnected: function () {
					classRoom.connection = null;
					classRoom.SlideShow.SlideShow = {};
					
					$('#memberList').empty();
					$('#chatContainer').empty();
					$('#user').empty();
					$("#instantFeedbackContainer").hide();
					$('#page').hide();
					$('#loginDialog').dialog('open');
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
						
						if(bool_bottom){
							chatContainer.scrollTop = chatContainer.scrollHeight;
						}

			
		},
		
		/**
		*	function: returns time
		*/
		time: function() {
				date = new Date();

				hour = (date.getHours() < 10 ? '0' + date.getHours () : date.getHours ());
				minute = (date.getMinutes() < 10 ? '0' + date.getMinutes () : date.getMinutes ());
				second = (date.getSeconds() < 10 ? '0' + date.getSeconds () : date.getSeconds ());
				
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
				classRoom.Utils.addHandler(classRoom.Handler.onInstantFeedBack, classRoom.FEEDBACK, 'message', 'groupchat');
				classRoom.Utils.addHandler(classRoom.Handler.onSlideChange, classRoom.SLIDE, 'message', 'groupchat');
		}
	},
	
	/**
	*	object containing all things about Slideshow
	*
	*
	*
	*/
	SlideShow: {
	
		slideShow: {},
		actualSlide: 1,
		
		/**
		*	function: initialize the slideShow by give feedBackItems with a count of 0
		*/
		setSlideShow: function(count) {
						for (var i = 1; i <= count; i++) {
							var slideFeedBack = new Array();
						
							for (var j = 0; j < classRoom.FeedBack.feedBackItems.length; j++) {
									var index = classRoom.FeedBack.feedBackItems[j];
								
									slideFeedBack[index] = 0;
							}
						
						classRoom.SlideShow.slideShow[i] = slideFeedBack;
					 	}	
		},
		
		/**
		*	function: returns number of slides
		*/
		getSlideShowCount: function() {
							var count = 0;
					
							for( var index in classRoom.SlideShow.slideShow) { count++; }
							return count;
		},
		
		/**
		*	function: updates a slide of SlideShow by given Feedback
		*/
		updateSlideShow: function(slide, item) {
							var actualSlide = +slide;
							classRoom.SlideShow.slideShow[actualSlide][item] +=1;
		},
		
		/**
		*	function: sends groupmessage because of changed slide and updates view
		*/
		handleSlideChange:	function() {
								var count = classRoom.SlideShow.getSlideShowCount();
								var actualSlide = classRoom.SlideShow.actualSlide.toString();
								var time = classRoom.Utils.time();
								
								$('#slideStatus').text( actualSlide + ' / ' + count);
								classRoom.FeedBack.enableItems();
								
								classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
																			.c('body').t('AKTUELLER SLIDE: ' + actualSlide)
																			.up() 
																			.c('time', time)
																			.up()
																			.c('feedback', {xmlns: classRoom.SLIDE})
																			.c('slide', actualSlide));
		},
		
		setSlideStatus: function(){
							var count = classRoom.SlideShow.getSlideShowCount();
							
							$('#previousSlide').text('<<');
							$('#nextSlide').text('>>');
							
							$('#slideStatus').text(classRoom.SlideShow.actualSlide + ' / ' + count);
							$('#instantFeedback').find('div[class="tableCaption"]').text('Folie:' + classRoom.SlideShow.actualSlide + ' / '
											+ count);
	
		}

	},	
	
	/**
	*	object containing all things about Feedback and its View
	*
	*
	*
	*/
	FeedBack: {
		
		feedBackItems: ['Slower', 'Faster', 'Louder', 'Softer', 'Repeat', 'Question'],
		
		setFeedbackItems: function(){
							for( var i = 0;  i < classRoom.FeedBack.feedBackItems.length; i++) {
								var s = classRoom.FeedBack.feedBackItems[i];
								$('ul#feedback').append('<li class="item" id="' + s +'">' + s + '</li>');
							}

		},
		
		/**
		*	function: updates View: container holding statistical information about feedback / slide
		*/
		updateFeedBackStatistic: function(slide) {
								var actualSlide = +slide;
								var feedback = classRoom.SlideShow.slideShow[actualSlide];
								
								$('#instantFeedback').empty();
								$('#instantFeedback').append('<div class="tableCaption">'
										+ 'Folie:' + classRoom.SlideShow.actualSlide + ' / '
										+ classRoom.SlideShow.getSlideShowCount() + '</div>');
					
								for( var index in feedback) {
									$('#instantFeedback').append('<div class="tableRow"><div class="itemIndex">' 
											+ index + ':</div><div class="itemValue" id="' 
											+ index +'">' + feedback[index] + '</div></div>');
								}
					
								classRoom.SlideShow.setSlideStatus();
					
		},
		
		feedBackNotification: function(data) {
								$('.notification > h3').empty();
								$('.notification > p').empty();
								
								var fbArray = classRoom.FeedBack.getFeedBackOfSlide(data.slide);
								
								$('.notification > h3').text('Feedback für Folie: ' + data.slide);
								
								for ( var index in fbArray) {
										$('.notification > p').append('<span>'  + index +': ' + fbArray[index] +' | ' + '</span>');
								}
								
								$('.notification').fadeIn('fast').delay(data.delay).fadeOut('fast');
		},
		
		/**
		*	function: returns all feedBacks to a given slide
		*/
		getFeedBackOfSlide: function(slide) {
								var actualSlide = +slide;
								return classRoom.SlideShow.slideShow[actualSlide];	
		},
		
		enableItems: function() {
					$('ul#feedback').find('li').each(function() { 
							$(this).show();
						});
		},
		
		disableItem: function(data) { 
						var item = data.object;
						$(item).css('display', 'none');	
		}
		
		
	},
	
	/**
	*	object containing all stanzas being sent to the jabber host
	*
	*
	*
	*/
	Action: {
		
		PresencePriority: function(number) {
			classRoom.connection.send($pres().c('priority').t(number));
		},
		
		Presence: function(name) {
			classRoom.connection.send( $pres({ to: classRoom.ROOM + '/' 
										   + name }).c('x' , {xmlns: classRoom.MUC}))							   
		},
		
		Disconnect: function(name) {
			classRoom.connection.send( $pres( { to: classRoom.ROOM + '/' + name,
													type: "unavailable"
												   }));
		},
		
		PublicMessage: function(text, time) {
			classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
													.c('body').t(text)
													.up()
													.c('time', time));
		},
		
		PrivateMessage: function(text, time, nick) {
			classRoom.connection.send( $msg( {to: classRoom.ROOM + '/' + nick , type: 'chat'} )
															.c('body').t(text)
															.up()
															.c('time', time));
		},
		
		SlideChange: function(actualSlide, time) {
			classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
																			.c('body').t('AKTUELLER SLIDE: ' + actualSlide)
																			.up() 
																			.c('time', time)
																			.up()
																			.c('feedback', {xmlns: classRoom.SLIDE})
																			.c('slide', actualSlide));
		},
		FeedBack: function(actualSlide, item, time) {
			classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
													.c('body').t('VOTE: '+ item + ' SLIDE: ' + actualSlide)
													.up()
													.c('time', time)
													.up()
													.c('feedback', {xmlns: classRoom.FEEDBACK})
													.c('feedbackItem', item)
													.up()
													.c('slide', actualSlide));
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
						if( $(presence).attr('type') === 'error' && !classRoom.joined ) {
							classRoom.connection.disconnect();
							alert('error');
						}
						else 
							if ( !classRoom.participants[nick] && $(presence).attr('type') !== 'unavailable') {
										classRoom.participants[nick] = true;
							/*now that the user has joined watch up for adding to list or to avatar*/
										if( nick === classRoom.nickName){
											$('#user').text(nick);
										}
										else{
											$('#memberList').append("<li id='" + nick + "'>" + "<div class='member'>"
																	+ "<div class='image'><img src='img/member.png' alt='pic'></div>"
																	+"<div class='nick'>" + nick + "</div></li>");
										}

							}
							else 
							/*user leaves the room, remove him from list*/
								if ( classRoom.participants[nick] && $(presence).attr('type') === 'unavailable') {
									$('#memberList li').each(function() {
										if(nick === $(this).attr('id')) {
											$(this).remove();
											return false;
										}
									});
								}
				
						/*handle own presence, nick changed?*/
						if ($(presence).attr('type') !== 'error' && !classRoom.joined) {		
						
							if($(presence).find("status[code ='110']").length > 0 ) {
								if($(presence).find("status[code ='210']").length > 0 ) {
									classRoom.nickName = Strophe.getResourceFromJid(from);
								}
							}
						else {
							classRoom.joined = true;
							classRoom.SlideShow.setSlideStatus();		
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
						
						var text = $(message).children('body').text();
						var time = $(message).children('time').text();
			
			
						if ( $(message).find('feedback').length > 0 ) {
							classRoom.Utils.addMessage("<div class='message hidden'>" 
													+"<div class='head'>" + time + " | " + nick + ":" + "</div>" 
													+"<div class='body'>" + text + "</div></div>");
						return true;
						}
						else
							if ( $(message).find('body').length > 0 ) {
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
		*	function: triggers View updates
		*/
		onInstantFeedBack: function(message){
							var item, actualSlide;
							
							if ($(message).find('feedback').length > 0) {
								$(message).find('feedback > feedbackItem').each(function () {
																					item = $(this).text();
																				});
								$(message).find('feedback > slide').each(function () {
																			actualSlide = $(this).text();
																		});
							}
			
							classRoom.SlideShow.updateSlideShow(actualSlide, item);
							classRoom.FeedBack.updateFeedBackStatistic(actualSlide);
	
		return true;
		},
		
		/**
		*	function: sets actualSlide, updates View, enables FeedBackItems
		*/
		onSlideChange: function(message) {
						var sSlide;
						
						if ($(message).find('feedback').length > 0) {
							$(message).find('feedback > slide').each(function () {
																		sSlide = $(this).text();
																	});
						}
						
						var actualSlide = +sSlide;
						classRoom.SlideShow.actualSlide = actualSlide;
						
						classRoom.FeedBack.enableItems();  
						classRoom.FeedBack.updateFeedBackStatistic(sSlide);
				
		return true;
		}
	}
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
		$("#instantFeedbackContainer").hide();
		$('.notification').hide();
		classRoom.FeedBack.setFeedbackItems();
		
		setInterval(function(){ 
					classRoom.FeedBack.feedBackNotification({delay: 5000, slide: classRoom.SlideShow.actualSlide});
							}, 20000);
							
		$('#loginDialog').dialog({
				autoOpen:true,
				draggable: false,
				modal: true,
				resizable: false,
				open: function() { 	$(".ui-dialog-titlebar-close").hide();
									$(".ui-dialog-titlebar").css({'background':'#3B5998', border:'0'});
								 },
				title: 'LOGIN',
				buttons: {
							'Enter': function()
									{
											classRoom.nickName = $('#nickname').val();
											classRoom.connect( { jid: $('#jid').val(), password: $('#password').val() });
																		   
											$('#password').val(''); 
											$(this).dialog('close');
									}
						 }
				});
	});



	
	
	
	
	
	
	
/**
	*
	*
	*jQuery Event Handlers
	*
	*
	*
	*/

	$(document).on('click', '#nextSlide', function() {
									var count = classRoom.SlideShow.actualSlide;
									
									if(count+1 <= classRoom.SlideShow.getSlideShowCount()) {
											classRoom.SlideShow.actualSlide++;
										}
										classRoom.SlideShow.handleSlideChange();
									
	});
								
	$(document).on('click', '#previousSlide', function() {
										var count = classRoom.SlideShow.actualSlide;
										
										if(count-1 > 0) {
												classRoom.SlideShow.actualSlide--;
											}
										classRoom.SlideShow.handleSlideChange();

	});

	$(document).on('click', '#toogle', function() {
								$("#instantFeedbackContainer").slideToggle("fast");
	});
							
	$(document).on('click', '#disconnect', function() {
				classRoom.connection.send( $pres( { to: classRoom.ROOM + '/' + classRoom.nickName,
													type: "unavailable"
												   }));
				classRoom.connection.disconnect();
	});
			
	$(document).on('keypress', '#input',  function(e) {
				if(e.which === 13) {
					e.preventDefault();
					var text = $(this).val();
					var time = classRoom.Utils.time();
					
					classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
													.c('body').t(text)
													.up()
													.c('time', time));
					$(this).val('');
				}	
	});
			
	$(document).on('click', 'ul#memberList li div.member',  function(e) {	
				e.preventDefault();
				var nick = $(this).parent().attr('id');

				$('#pmDialog').dialog({
						autoOpen:true,
						draggable: true,
						modal: false,
						resizable: true,
						title: 'PM to: ' + nick,
						open: function() {$(".ui-dialog-titlebar").css({'background':'#3B5998', border:'0'});},
						buttons: {
									'SEND': function() {
												var text = $('#pmMessage').val();
												var time = classRoom.Utils.time();
												
												classRoom.connection.send( $msg( {to: classRoom.ROOM + '/' + nick ,
																			type: 'chat'} )
															.c('body').t(text)
															.up()
															.c('time', time));
																				   
													$('#pmMessage').val('');
													$(this).dialog('close');
											}
								 }
				});
						
		
	});
			
	$(document).on('click','ul#feedback li.item', function() {
				var item = $(this).attr('id');
				var actualSlide = classRoom.SlideShow.actualSlide.toString();
				var time = classRoom.Utils.time();
				
				classRoom.FeedBack.disableItem( {object: $(this)} );
				
				classRoom.connection.send( $msg( {to: classRoom.ROOM, type: 'groupchat'} )
													.c('body').t('VOTE: '+ item + ' SLIDE: ' + actualSlide)
													.up()
													.c('time', time)
													.up()
													.c('feedback', {xmlns: classRoom.FEEDBACK})
													.c('feedbackItem', item)
													.up()
													.c('slide', actualSlide)); 
	});
	

}());			
	
	
	