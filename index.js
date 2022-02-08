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
// 

function updateCommand() {
	const commands = [];
	const commandFolders = fs.readdirSync('./commands');
	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			try {
				const command = require(`./commands/${folder}/${file}`);
				client.commands.set(command.data.name, command);
			}
			catch (error) {
				console.log(`Error occurred while registering: ${file} command. Error: ${error}`);
			}
		}
	}
	return commands;
}

async function permissionHandler(interaction, command) {
	const roleIds = []
	const channelIds = []

	if (!interaction.inGuild() && command.permissions["dm"]) {
		await command.execute(interaction, client)
		access_logger(interaction, "DM");
		return
	} else if (!interaction.inGuild()) {
		await interaction.reply({ content: 'You cannot use this command in a DM.', ephemeral: true });
		return
	}
	for (let role of command.permissions.roles) {
		if (config.allRoles[role] === "Master") {
			config.allRoles.Master.forEach((item) => roleIds.push(config.allRoles[item]));
		}
		else if (config.allRoles[role]) {
			roleIds.push(config.allRoles[role])
		}
	}

	for (let channel of command.permissions.channel) {
		if (config.allChannels[channel]) {
			channelIds.push(config.allChannels[channel])
		}
	}

	if (!interaction.member._roles.some(e => roleIds.includes(e)) && command.permissions.roles.length > 0) {
		await interaction.reply({ content: 'You are not allowed to use this command', ephemeral: true });
		access_logger(interaction, "Perm");
	} else if (command.permissions.channel.length === 1 && command.permissions.dm === true) {
		await interaction.reply({ content: 'This command can only be used via DMs.', ephemeral: true });
	}
	else if (!channelIds.includes(interaction.channel.id) && command.permissions.channel.length > 0) {
		let channelstring = "";
		for (let channel of command.permissions.channel) {
			channelstring += `<#${config.allChannels[channel]}>, `
		}
		channelstring = channelstring.slice(0, -2);
		await interaction.reply({ content: `You cannot use this command in this channel.\n Try using it in the following channels: ${channelstring}`, ephemeral: true });
	}
	else if (rateLimiter.take(interaction.user.id) && !is_Rate_Limit_Excused(interaction.member)) {
		await interaction.reply({ content: `Hey, you're doing doing that too often, please try again later!`, ephemeral: true });
	} else {
		if (command.data.name === "dh-config") {
			config = await command.execute(interaction, client);
			updateCommand();
			updateRateLimiter();
		}
		else {
			await command.execute(interaction, client);
		}
		access_logger(interaction, "CMD");
	}
}
