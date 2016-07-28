'use strict'

const inspect = console.log; //require('util').inspect;

const apiToken = "youtotken";
const Slack = require('slack-node');

let slack = new Slack(apiToken);

const Youtube = require("youtube-api")
    , fs = require("fs")
    , readJson = require("r-json")
    , Lien = require("lien")
    , opn = require("opn")
    ;

// I downloaded the file from OAuth2 -> Download JSON
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

// Init lien server
let server = new Lien({
    host: "localhost"
  , port: 5000
});

// Authenticate
// You can access the Youtube resources via OAuth2 only.
// https://developers.google.com/youtube/v3/guides/moving_to_oauth#service_accounts
let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
});

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const radio = new MyEmitter();

//opn(oauth.generateAuthUrl({
    //access_type: "offline",
    //scope: [
        //"https://www.googleapis.com/auth/youtubepartner",
        //"https://www.googleapis.com/auth/youtube",
        //"https://www.googleapis.com/auth/youtube.force-ssl"]
//}));

// Handle oauth2 callback
server.addPage("/oauth2callback", lien => {
    console.log("Trying to get the token using the following code: " + lien.query.code);
    oauth.getToken(lien.query.code, (err, tokens) => {
        if (err) {
            return console.log(err);
        }

        console.log("Got the tokens.");
        oauth.setCredentials(tokens);

        radio.emit('yt.auth');

        lien.end("The video is being uploaded. Check out the logs in the terminal.");
    });
});

//radio.on('yt.auth', function() {
//});

slack.api("channels.list", function(err, response) {
    // inspect(response);

    var channelId;
    for (var channel of response.channels) {
        if (channel.name == 'music-room') {
            channelId = channel.id;
            break;
        }
    }

    inspect(channelId);

    slack.api("channels.history", {
        channel: channelId,
        count: 100
    }, function(err, response) {
        var latest = response.latest;

        var videoIds = response.
            messages.
            filter(message => message.hasOwnProperty('attachments')).
            map(message => message.attachments).
            filter(attachment => attachment.service_name == 'YouTube').
            reduce(function(attachment, current) {
                inspect(attachment);
                current.push((/watch\?v=([\s\S]*)/g).exec(attachment.title_link)[1]);
                current
            }, []);

        inspect(videoIds);
        //for (var message of response.messages) {
            //// inspect(message);

            //if (!message.hasOwnProperty('attachments')) {
                //continue;
            //}

            //message.attachments.filter

            //for (var attachment of message.attachments) {
                //if (attachment.service_name == 'YouTube') {
                    //var videoId = (/watch\?v=([\s\S]*)/g).exec(attachment.title_link)[1];
                    //inspect(videoId);

                    //(function(vid) {
                        //inspect(vid);
                        //var request = Youtube.playlistItems.insert({
                            //part: 'snippet',
                            //resource: {
                                //snippet: {
                                    //"playlistId": "PLtWXldWoTZn6epDUY0m6zej9tqP8EWdHI",
                                    //"resourceId": {
                                        //"kind": "youtube#video",
                                        //"videoId": vid
                                    //}
                                //}
                            //}
                        //}, (err, data) => {
                            //inspect(data.snippet.title);
                        //});

                        //yt.push(request);
                    //})(videoId);
                //}
            //}
        //}
    });
});
