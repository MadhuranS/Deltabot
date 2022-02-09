const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
var ip = require("ip");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dh-stats')
		.setDescription('Shows bot statistics')
		.setDefaultPermission(true),
	permissions: {
		roles: ["Admin", "Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
		channel: ["tech"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id in
	},
	async execute(interaction) {
		const icon = interaction.guild.iconURL({ size: 2048 });
		//get Ip address
		const ipadd = ip.address();
		const embed = new MessageEmbed()
			.setThumbnail(icon)
			.setTitle('Bot Status')
			.setColor('#d34993')
			.setDescription('Stats about this bot and server')
			.addField(
				'HEAP USAGE',
				`\`\`\`${Math.round(process.memoryUsage().heapUsed / 1048576)}mb\`\`\``,
			)
			.addField(
				'UPTIME',
				`\`\`\`${formatTime(process.uptime())}\`\`\``,
			)
			.addField(
				'Location',
				`\`\`\`${ipadd == "137.184.146.11" ? "Running On Discord" : "Running Locally"}\`\`\``,
			);
		interaction.reply({ embeds: [embed] });
	},
};

function formatTime(milliseconds) {
	const sec_num = parseInt(milliseconds, 10);
	let hours = Math.floor(sec_num / 3600);
	let minutes = Math.floor((sec_num - hours * 3600) / 60);
	let seconds = sec_num - hours * 3600 - minutes * 60;

	if (hours < 10) {
		hours = `0${hours}`;
	}
	if (minutes < 10) {
		minutes = `0${minutes}`;
	}
	if (seconds < 10) {
		seconds = `0${seconds}`;
	}
	const time = `${hours}:${minutes}:${seconds}`;
	return time;
}
