const { RateLimiter } = require("discord.js-rate-limiter");
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

let config = require("./config.json");
let globalstats = require("./logs/stats.json");

let rateLimiter = new RateLimiter(
	config.rate_limit.Messages,
	config.rate_limit.Per_millisecond
);

client.commands = new Collection();
const io = require('@pm2/io')

// PM2 Setup
const pm2log1 = io.metric({
	name: 'Access Count',
})
const pm2log2 = io.metric({
	name: 'Errors',
})
const pm2log3 = io.metric({
	name: 'DMs',
})
const pm2log4 = io.metric({
	name: 'CMDs',
})
const pm2log5 = io.metric({
	name: 'Last Used',
})