const tmi = require('tmi.js');
const axios = require('axios');
const myArgs = process.argv.slice(2);
let currentMessageCount = 0;
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

console.log(process.env.TWITCH_OAUTH);
console.log(myArgs[0]);


const client = new tmi.Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: 'StreamUpdaterBot',
        password: process.env.TWITCH_OAUTH
    },
    channels: [myArgs[0]]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    // Ignore echoed messages.
    currentMessageCount = currentMessageCount + 1;
    if(self) return;

    // Send message to our API for handling
    axios
        .post('https://streamupdater.com/api/bot/processmessage', {
            channel_display_name: channel,
            display_name: tags.username,
            message: message,
            apikey: process.env.API_KEY
        })
        .then(res => {
            if(res.data.commandReturned == true) {
                client.say(channel, `@${tags.username}, ${res.data.message}`);
            }
        })
        .catch(error => {
            console.error(error);
        });

    // Check we don't need to check for automated messages
    if(currentMessageCount > 5) {
        axios
            .get('https://streamupdater.com/api/bot/automatedmessages?username=' + myArgs[0] + '&apikey=' + process.env.API_KEY)
            .then(res => {
                if(res.data.status != undefined && res.data.status != false) {
                    client.say(channel, `${res.data.response}`);
                }
            })
            .catch(error => {
                console.error(error);
            });

        // Set to minus 1 because we're about to add 1 on after we set this
        currentMessageCount = 0;
    }
});