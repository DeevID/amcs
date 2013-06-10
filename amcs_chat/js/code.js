var classRoom =
        {
            NS_BOSH: "http://localhost/http-bind",
            NS_MUC: "http://jabber.org/protocol/muc",
            NS_OpenFireDomain: "jabber",
            NS_FIXED_ROOM: "raum1@conference.jabber",
            NS_INSTANT_FEEDBACK: "acms:ns:instantFeedback",
            NS_SLIDE: "acms:ns:slide",
            connection: null,
            nickName: null,
            joined: null, // onConnected->false; roomJoined->true
            participants: null, //Boolean Array: true - joined the room

            init: function(service, options) {
                /*/
                 *  Candy.Core
                 */

                //new Strophe.Connection(_service);
                //options:domain, roomjid setzen
                //namespaces, handler setzen
                //Aufruf Funktionen: connect()
            },
            feedback:
                    {
                        feedbackItems: ['Slower', 'Faster', 'Louder', 'Softer', 'Repeat', 'Question'],
                        SlideShowArray: {},
                        actualSlide: 1,
                        initSlideShowArray: function(count)
                        {
                            for (var i = 1; i <= count; i++)
                            {
                                var slideFeedBack = new Array();

                                for (var j = 0; j < classRoom.feedback.feedbackItems.length; j++)
                                {
                                    var index = classRoom.feedback.feedbackItems[j];
                                    slideFeedBack[index] = 0;
                                }

                                classRoom.feedback.SlideShowArray[i] = slideFeedBack;
                            }
                        },
                        getSlideShowCount: function()
                        {
                            var count = 0;
                            for (var index in classRoom.feedback.SlideShowArray)
                            {
                                count++;
                            }
                            return count;
                        },
                        updateSlideShowArray: function(slide, item)
                        {
                            var actualSlide = +slide;
                            classRoom.feedback.SlideShowArray[actualSlide][item] += 1;
                        },
                        updateFeedBackContent: function(slide)
                        {
                            var actualSlide = +slide;
                            var feedback = classRoom.feedback.SlideShowArray[actualSlide];
                            $('#instantFeedback').empty();

                            $('#instantFeedback').append('<div class="tableCaption">'
                                    + 'Folie:' + classRoom.feedback.actualSlide + ' / '
                                    + classRoom.feedback.getSlideShowCount()
                                    + ' </div>');

                            for (var index in feedback)
                            {
                                $('#instantFeedback').append('<div class="tableRow"><div class="itemIndex">'
                                        + index + ':</div><div class="itemValue" id="'
                                        + index + '">' + feedback[index] + '</div></div>');
                            }

                            $(document).trigger('setSlideStatus');

                        },
                        getFeedBack: function(slide, item)
                        {
                            var actualSlide = +slide;
                            return classRoom.feedback.SlideShowArray[actualSlide][item];
                        },
                        getCompleteFeedBack: function(slide)
                        {
                            var actualSlide = +slide;
                            return classRoom.feedback.SlideShowArray[actualSlide];

                        }


                    },
            /*populate member area with members, nickname conflict, handle own presence, trigger joined*/

            onPresence: function(presence)
            {
                var from = $(presence).attr('from');
                var nick = Strophe.getResourceFromJid(from);


                if ($(presence).attr('type') === 'error' && !classRoom.joined)
                {
                    classRoom.connection.disconnect();
                    alert('error');
                }

                /*add to list except yourself */
                else if (!classRoom.participants[nick] && $(presence).attr('type') !== 'unavailable')
                {
                    classRoom.participants[nick] = true;

                    if (nick === classRoom.nickName)
                    {
                        $('#user').text(nick);
                    }
                    else
                    {
                        $('#memberList').append(
                                "<li id='" + nick + "'>" +
                                "<div class='member'><div class='image'><img src='img/member.png' alt='pic'></div><div class='nick'>"
                                + nick + "</div></li>");
                    }


                    if (classRoom.joined)
                    {
                        //$(document).trigger('userHasJoined', nick);
                    }
                }

                else if (classRoom.participants[nick] && $(presence).attr('type') === 'unavailable')
                {//remove from list
                    $('#memberList li').each(function()
                    {
                        if (nick === $(this).attr('id'))
                        {
                            $(this).remove();
                            return false;
                        }
                    });

                    //$(document).trigger('userHasLeft', nick);
                }

                if ($(presence).attr('type') !== 'error' && !classRoom.joined)
                {
                    //handle own presence
                    if ($(presence).find("status[code ='110']").length > 0)
                    {
                        if ($(presence).find("status[code ='210']").length > 0) //own nick change?
                        {
                            classRoom.nickName = Strophe.getResourceFromJid(from);
                        }


                    }
                    else
                    {
                        $(document).trigger('roomJoined');
                        //join if its the first time it receives the user’s own presence

                        $(document).trigger('setSlideStatus');

                    }
                }

                return true;
          },
            publicMessage: function(message)
            {
                var from = $(message).attr('from')
                var nick = Strophe.getResourceFromJid(from);

                var text = $(message).children('body').text();
                var time = $(message).children('time').text();


                if ($(message).find('feedback').length > 0)
                {
                    classRoom.addMessage("<div class='message hidden'>" +
                            "<div class='head'>" + time + " | " + nick + ":" + "</div>" +
                            "<div class='body'>" + text + "</div></div>");
                    return true;
                }
                else

                if ($(message).find('body').length > 0)
                {
                    classRoom.addMessage("<div class='message'>" +
                            "<div class='head'>" + time + " | " + nick + ":" + "</div>" +
                            "<div class='body'>" + text + "</div></div>");
                }

                return true;

            },
            privateMessage: function(message)
            {
                var from = $(message).attr('from')
                var nick = Strophe.getResourceFromJid(from);
                var text = $(message).children('body').text();

                var time = classRoom.time();

                classRoom.addMessage("<div class='message private'>" +
                        "<div class='head'>" + time + " | " + nick + ":" + "</div>" +
                        "<div class='body'>" + text + "</div></div>");

                return true;

            },
            addMessage: function(message) //adding new lines at the bottom and fix scrollbar position
            {
                var chatContainer = $('#chatContainer').get(0);
                var bool_bottom = chatContainer.scrollTop >= chatContainer.scrollHeight - chatContainer.clientHeight;

                $('#chatContainer').append(message);

                if (bool_bottom)
                {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }


            },
            time: function()
            {
                date = new Date();

                hour = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours());
                minute = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
                second = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

                return  hour + ':' + minute + ':' + second;

            },
            onInstantFeedBack: function(message)
            {
                var item, actualSlide;

                if ($(message).find('feedback').length > 0)
                {
                    $(message).find('feedback > feedbackItem').each(function()
                    {
                        item = $(this).text();
                    });
                    $(message).find('feedback > slide').each(function()
                    {
                        actualSlide = $(this).text();
                    });
                }

                classRoom.feedback.updateSlideShowArray(actualSlide, item);
                classRoom.feedback.updateFeedBackContent(actualSlide);

                return true;
            },
            onSlideChange: function(message)
            {
                var actualSlideString;

                if ($(message).find('feedback').length > 0)
                {
                    $(message).find('feedback > slide').each(function()
                    {
                        actualSlideString = $(this).text();
                    });
                }

                var actualSlideValue = +actualSlideString;
                classRoom.feedback.actualSlide = actualSlideValue;

                $(document).trigger('enableItems');
                classRoom.feedback.updateFeedBackContent(actualSlideString);

                return true;
            }
        };

/***************************************************************************************/
/***************************************************************************************/

$(document).ready(function()
{
    $('#page').hide();
    $("#instantFeedbackContainer").hide();
    $('.notification').hide();
    $(document).trigger('setFeedbackItems');


    setInterval(function() {
        $(document).trigger('feedBackNotification',
                {delay: 5000, slide: classRoom.feedback.actualSlide});
    }, 20000);

    /*
     $(window).resize(function() {
     document.body.style.fontSize = parseInt(document.documentElement.clientWidth/50) + 'px';
     });
     */


    $('#nextSlide').click(function()
    {
        var count = classRoom.feedback.actualSlide;

        if (count + 1 <= classRoom.feedback.getSlideShowCount())
        {
            classRoom.feedback.actualSlide++;
        }
        $(document).trigger('handleSlideChange');
        /*	$(document).trigger('SlideNotification', 
         {delay: 2000, slide: classRoom.feedback.actualSlide} ); */
    });

    $('#previousSlide').click(function()
    {
        var count = classRoom.feedback.actualSlide;

        if (count - 1 > 0)
        {
            classRoom.feedback.actualSlide--;
        }
        $(document).trigger('handleSlideChange');
        /*	$(document).trigger('SlideNotification', 
         {delay: 2000, slide: classRoom.feedback.actualSlide} ); */
    });

    $('#loginDialog').dialog(
            {
                autoOpen: true,
                draggable: false,
                modal: true,
                resizable: false,
                open: function() {
                    $(".ui-dialog-titlebar-close").hide();
                    $(".ui-dialog-titlebar").css({'background': '#3B5998', border: '0'});
                },
                title: 'LOGIN',
                buttons: {
                    'Enter': function()
                    {
                        classRoom.nickName = $('#nickname').val();

                        $(document).trigger('connect', {jid: $('#jid').val(),
                            password: $('#password').val()
                        });

                        $('#password').val('');
                        $(this).dialog('close');
                    }
                }
            });

    /***************************************************************************************/

    $('#disconnect').click(function()
    {
        classRoom.connection.send($pres({to: Strophe.NS.NS_FIXED_ROOM + '/' + classRoom.nickName,
            type: "unavailable"
        }));
        classRoom.connection.disconnect();
    });

    /***************************************************************************************/

    $('#input').keypress(function(e)
    {
        if (e.which === 13) //enter Taste
        {
            e.preventDefault();
            var text = $(this).val();
            var time = classRoom.time();

            classRoom.connection.send($msg({to: Strophe.NS.NS_FIXED_ROOM, type: 'groupchat'})
                    .c('body').t(text)
                    .up()
                    .c('time', time));
            $(this).val('');
        }

    });

    /***************************************************************************************/

    $('ul#memberList').on('click', 'li div.member', function(e)

    {
        e.preventDefault();
        var nick = $(this).parent().attr('id');


        $('#pmDialog').dialog(
                {
                    autoOpen: true,
                    draggable: true,
                    modal: false,
                    resizable: true,
                    title: 'PM to: ' + nick,
                    open: function() {
                        $(".ui-dialog-titlebar").css({'background': '#3B5998', border: '0'});
                    },
                    buttons: {
                        'SEND': function()
                        {
                            var text = $('#pmMessage').val();

                            classRoom.connection.send($msg({to: Strophe.NS.NS_FIXED_ROOM + '/' + nick,
                                type: 'chat'})
                                    .c('body').t(text));

                            $('#pmMessage').val('');
                            $(this).dialog('close');
                        }
                    }
                });


    });
    /***************************************************************************************/

    $('ul#feedback').on('click', 'li.item', function()

    {
        var item = $(this).attr('id');
        var actualSlide = classRoom.feedback.actualSlide.toString();
        var time = classRoom.time();

        $(document).trigger('disableItem', {object: $(this)});

        classRoom.connection.send($msg({to: Strophe.NS.NS_FIXED_ROOM, type: 'groupchat'})
                .c('body').t('VOTE: ' + item + ' SLIDE: ' + actualSlide)
                .up()
                .c('time', time)
                .up()
                .c('feedback', {xmlns: Strophe.NS.NS_INSTANT_FEEDBACK})
                .c('feedbackItem', item)
                .up()
                .c('slide', actualSlide));

    });
    /***************************************************************************************/

    $("#toogle").click(function() {
        $("#instantFeedbackContainer").slideToggle("fast");
    });

});


/***************************************************************************************/
/***************************************************************************************/

$(document).bind('connect', function(ev, data)
{
    classRoom.connection = new Strophe.Connection(Strophe.NS.NS_BOSH);
    classRoom.connection.connect(data.jid, data.password,
            function(status)
            {
                if (status === Strophe.Status.CONNECTED)
                {
                    $(document).trigger('connected');
                }
                else if (status === Strophe.Status.CONNECTING)
                {
                    $(document).trigger('connecting');
                }
                else if (status === Strophe.Status.DISCONNECTED)
                {
                    $(document).trigger('disconnected');
                }
            });


});

/***************************************************************************************/

$(document).bind('connected', function() {

    classRoom.joined = false;

    classRoom.feedback.initSlideShowArray(3);

    classRoom.participants = {};
    classRoom.connection.send($pres().c('priority').t('-1'));

    /*
     addHandler: function (	handler, ns, name, type, id, from, options)
     */

    //  presence handler: <handler, ns, name>
    classRoom.connection.addHandler(classRoom.onPresence, null, 'presence');

    // message handler type groupchat: <handler, ns, name, type>
    classRoom.connection.addHandler(classRoom.publicMessage, null, 'message', 'groupchat');

    // message handler type chat: <handler, ns, name, type>
    classRoom.connection.addHandler(classRoom.privateMessage, null, 'message', 'chat');

    //instantFeedBack: <handler, ns, name, type>
    classRoom.connection.addHandler(classRoom.onInstantFeedBack, Strophe.NS.NS_INSTANT_FEEDBACK, 'message', 'groupchat');

    //slideChange: <handler, ns, name, type>
    classRoom.connection.addHandler(classRoom.onSlideChange, Strophe.NS.NS_SLIDE, 'message', 'groupchat');


    classRoom.connection.send($pres({to: Strophe.NS.NS_FIXED_ROOM + '/'
                + classRoom.nickName}).c('x', {xmlns: Strophe.NS.NS_MUC}));

    $('#page').show();


});

/***************************************************************************************/

$(document).bind('connecting', function() {
    $('#user').text('Connecting..');

});

/***************************************************************************************/

$(document).bind('disconnected', function() {

    classRoom.connection = null;

    classRoom.feedback.SlideShowArray = {};

    $('#memberList').empty();
    $('#chatContainer').empty();
    $('#user').empty();
    $("#instantFeedbackContainer").hide();
    $('#page').hide();
    $('#loginDialog').dialog('open');
    //$('#status').empty();


});

/***************************************************************************************/

$(document).bind('roomJoined', function() {

    classRoom.joined = true;

});

/***************************************************************************************/

$(document).bind('userHasJoined', function(e, nick) {

    var time = classRoom.time();

    classRoom.addMessage("<div class='userStatus'>" + time + " | " + nick + " has joined.</div>");

});

/***************************************************************************************/

$(document).bind('userHasLeft', function(e, nick) {

    var time = classRoom.time();

    //classRoom.participants[nick] = false;

    classRoom.addMessage("<div class='userStatus'>" + time + " | " + nick + " has left.</div>");


});

/***************************************************************************************/
$(document).bind('setFeedbackItems', function() {

    for (var i = 0; i < classRoom.feedback.feedbackItems.length; i++)
    {
        var s = classRoom.feedback.feedbackItems[i];
        $('ul#feedback').append('<li class="item" id="' + s + '">' + s + '</li>');
    }

});

/***************************************************************************************/
$(document).bind('setSlideStatus', function() {

    var count = classRoom.feedback.getSlideShowCount();

    $('#previousSlide').text('<<');
    $('#nextSlide').text('>>');

    $('#slideStatus').text(classRoom.feedback.actualSlide + ' / ' + count);
    $('#instantFeedback').find('div[class="tableCaption"]').text('Folie:' + classRoom.feedback.actualSlide + ' / '
            + count);

});

/***************************************************************************************/
// in prev und next click
$(document).bind('handleSlideChange', function()
{
    var count = classRoom.feedback.getSlideShowCount();
    var actualSlide = classRoom.feedback.actualSlide.toString();
    var time = classRoom.time();

    $('#slideStatus').text(actualSlide + ' / ' + count);
    $(document).trigger('enableItems');

    classRoom.connection.send($msg({to: Strophe.NS.NS_FIXED_ROOM, type: 'groupchat'})
            .c('body').t('AKTUELLER SLIDE: ' + actualSlide)
            .up()
            .c('time', time)
            .up()
            .c('feedback', {xmlns: Strophe.NS.NS_SLIDE})
            .c('slide', actualSlide));
});

/***************************************************************************************/

$(document).bind('SlideNotification', function(ev, data)
{
    $('.notification > h3').text('Folie: ' + data.slide.toString());
    $('.notification').fadeIn('fast').delay(data.delay).fadeOut('fast');
});
/***************************************************************************************/

$(document).bind('feedBackNotification', function(ev, data)
{
    $('.notification > h3').empty();
    $('.notification > p').empty();

    var fbArray = classRoom.feedback.getCompleteFeedBack(data.slide);

    $('.notification > h3').text('Feedback für Folie: ' + data.slide);

    for (var index in fbArray)
    {
        $('.notification > p').append('<span>' + index + ': ' + fbArray[index] + ' | ' + '</span>');
    }

    $('.notification').fadeIn('fast').delay(data.delay).fadeOut('fast');
});
/***************************************************************************************/

$(document).bind('disableItem', function(ev, data)
{
    var item = data.object;
    $(item).css('display', 'none');
});

$(document).bind('enableItems', function()
{
    $('ul#feedback').find('li').each(function()
    {
        $(this).show();
    });
});




