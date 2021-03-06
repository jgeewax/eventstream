var $tweettemplate;
var $detailtemplate;
var foundtweets;
var tweetqueue;
var maxlist = 1000;
var updateinterval;
var detailinterval;
var searchinterval;


$(document).ready( function() {

    $tweettemplate = $("#tweettemplate").clone();
    $("#tweettemplate").remove();
    $detailtemplate = $("#tweetdetailtemplate").clone();
    $("#tweetdetailtemplate").remove();

    $.timeago.settings.strings['seconds'] = "%d seconds";

    foundtweets = {};
    tweetqueue = [];
   

    searchTwitter( searchquery );
    searchPlus( searchquery );
    searchinterval = setInterval( function() {
        searchTwitter( searchquery );
        searchPlus( searchquery );
    }, 10000);

    updateinterval = setInterval( function() {
        updateTweetList();
    }, 1000 );

    detailinterval = setInterval( function() {
        updateTweetDetail();
    }, 5000 );

    setTimeout( function() {
        updateTweetDetail();
    }, 3000 );


    $("#tweetfocus").css('cursor','pointer');
    $("#tweetfocus").click( function() {
        $(this).fadeOut();
    });


});

function updateTweetDetail() {

    var $lasttweetitem = $('#tweetwall').children().first();
    if ( $lasttweetitem && $lasttweetitem.get(0) && $lasttweetitem.attr('id').match( /tweet_/ ) ) {
    
        var tweetid = $lasttweetitem.attr('id').replace(/^tweet_/, "");
        
        var tweet = foundtweets[tweetid];
        if ( ! tweet ) {
            return;
        }

        var style = "style-" + Math.floor( Math.random() * 5 );

        var $tweetitem = $('<div id="detail_' + tweet['id']  + '" class="detailholder ' + style + '">' + $detailtemplate.html() + '</div>'); 
        $tweetitem.css('display','none');
        $tweetitem.find('.photo img').attr('src', tweet['img_lrg'] );
        $tweetitem.find('.tweettext').text( tweet['text'] );
        $tweetitem.find('.author').text( tweet['screen_name'] );
        $tweetitem.find('.created_at').text( tweet['created_at'] ).css('display','none');
        $tweetitem.find('.created_friendly').text( $.timeago(tweet['created_at']) );
        if ( tweet['attached_image'] ) {
            //img = $('<img />').attr('src', tweet['attached_image']);
            $tweetitem.find('.attached_image')
                .css({
                    'display': 'block',
                    'background-size': 'cover',
                    'background-repeat': 'no-repeat',
                    'background-position': '50% 50%',
                    'background-image': 'url(' + tweet['attached_image'] + ')'
                });
                //.append( img );
            $tweetitem.find('.metadata').addClass('hasimage');
        }

        var $olditem = $('#tweetdetail').children().first();

        if ( $olditem.get(0) && $olditem.attr('id') != "detail_" + tweet['id'] ) {
           
            //fetchUserInfo( tweet['user'], $tweetitem );

            $olditem.fadeOut('fast', function(){

                $tweetitem.css('cursor','pointer');
                $tweetitem.click( function() {
                    showDetail( tweet['id'] );
                });

                $('#tweetdetail').prepend( $tweetitem );
                $tweetitem.hide().fadeIn();

                $(this).remove();
        
            });
        } else if ( $olditem.attr('id') != "detail_" + tweet['id'] ) {
            $tweetitem.css('cursor','pointer');
            $tweetitem.click( function() {
                showDetail( tweet['id'] );
            });
            //fetchUserInfo( tweet['user'], $tweetitem );
            $('#tweetdetail').prepend( $tweetitem );
            $tweetitem.hide().fadeIn();
        }
    }

}
        

function showDetail( tweetid ) {
    
    var tweet = foundtweets[tweetid];
console.log( tweet )
    $tweetitem = $("#tweetfocuscontent");
    $tweetitem.find('.tweettext').text( tweet['text'] );
    $tweetitem.find('.author').text( tweet['screen_name'] );
    $tweetitem.find('.created_at').text( tweet['created_at'] ).css('display','none');
    
    if ( tweet['attached_image'] ) {
        img = $('<img />').attr('src', tweet['attached_image']);
        $tweetitem.find('.attached_image').css('display','block').append( img );
    }

    $("#tweetfocus").fadeIn();

}

function updateTweetList() {
    if ( tweetqueue.length > 0 ) {
    
        var tweet = tweetqueue.shift();

        
        var style = "style-" + Math.floor( Math.random() * 5 );
        var $tweetitem = $('<div id="tweet_' + tweet['id']  + '" class="tweetholder ' + style + '">' + $tweettemplate.html() + '</div>');
        $tweetitem.css('display','none');

        $tweetitem.find('.photo img').attr('src', tweet['img_sml'] );
        $tweetitem.find('.tweettext').text( tweet['text'] );
        $tweetitem.find('.author').text( tweet['screen_name'] );
        //$tweetitem.find('.created_at').text( tweet['created_at'] ).css('display','none');

        $tweetitem.css('cursor','pointer');
        $tweetitem.click( function() {
            showDetail( tweet['id'] );
        });

        $('#tweetwall').prepend( $tweetitem );
        $tweetitem.children().css('visibility','hidden');
        $tweetitem.slideDown('fast', function() {
            $(this).children('.photo, .tweettext, .byline').css('visibility','visible').hide().fadeIn();
        });

    }

    $('#tweetwall, #tweetdetail, #tweetfocus').find('.created_at').each( function() {
    
        var time = $(this).text();
        $(this).parent().find('.created_friendly').text( $.timeago(time) );
    
    });

}


function fillTweetQueue( tweets ) {
    
    for ( var x = tweets.length-1; x >=0; x-- ) {
        var tweet = tweets[x];
        if ( !foundtweets[ tweet['id_str'] ] ) {
            
            var tweetdata = {};
            tweetdata['id'] = tweet['id_str'];
            tweetdata['screen_name'] = '@' + tweet['user']['screen_name'];
            tweetdata['text'] = tweet['text'];
            tweetdata['img_sml'] = tweet['user']['profile_image_url'];
            tweetdata['img_lrg'] = tweet['user']['profile_image_url'].replace(/_normal\./, "_reasonably_small.");
            tweetdata['created_at'] = tweet['created_at'];
            
            if ( tweet['entities'] && tweet['entities']['media'] && tweet['entities']['media'][0]['type'] == 'photo' ) {
                tweetdata['attached_image'] = tweet['entities']['media'][0]['media_url'];
                console.log('found:' + tweetdata['attached_image'] );
            }
            foundtweets[ tweet['id_str'] ] = tweetdata;
            tweetqueue.push( tweetdata );
        }
    }
}

function fillPlusQueue( posts ) {
    for ( var x = posts.length-1; x >=0; x-- ) {
        var post = posts[x];
        if ( !foundtweets[ post['id_str'] ] ) {
            var data = {};
            data['id'] = post['id_str'];
            data['screen_name'] = '+' + post['screen_name'];
            data['text'] = post['text'];
            data['img_sml'] = post['img_sml'];
            data['img_lrg'] = post['img_lrg'];
            data['created_at'] = post['created_at'];
            if ( post['attached_image'] ) {
                data['attached_image'] = post['attached_image'];
            }
            foundtweets[ post['id_str'] ] = data;
            tweetqueue.push( data );
        }
    }

}


function searchTwitter( query ) {

    var tweets = [];

    var url = "https://api.twitter.com/1.1/search/tweets.json?count=10&result_type=recent&q=" + encodeURIComponent( query ) + "";
    $.get( '/api/twitter/get', {
        'api_url': url
    }, function( data ) {
        console.log( data );
        if ( data && data['statuses'] && data['statuses'].length > 0 ) {
            tweets = data['statuses'];
        }
        fillTweetQueue( tweets );
    });

}

function searchPlus( query ) {

    var posts = [];

    $.get( '/api/googleplus/search', {
        'q': query
    }, function( data ) {
        console.log( data );
        if ( data && data['items'] && data['items'].length > 0 ) {
            posts = data['items'];
        }
        fillPlusQueue( posts );
    });

}
