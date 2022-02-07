const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');
const fs = require('fs');

const { clientId, guildId } = require('./config.json');

function getCommands() {
	const commands = { "global": [], "guild": [] };
	const commandFolders = fs.readdirSync('./commands');
	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			try {
				const command = require(`./commands/${folder}/${file}`);
				if (command.permissions.dm) {
					commands["global"].push(command.data.toJSON());
				}
				else {
					commands["guild"].push(command.data.toJSON());
				}
			}
			catch (error) {
				console.log(`Error occurred while registering: ${file} command. Error: ${error}`);
			}
		}
	}
	return commands;
}
const allCommands = getCommands();
const guildCommands = allCommands["guild"];
const globalCommands = allCommands["global"];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: globalCommands },
		);
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: guildCommands },
		);


		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

