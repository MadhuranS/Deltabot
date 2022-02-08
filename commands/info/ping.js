const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dh-ping')
		.setDescription('Responds back with bot ping')
		.setDefaultPermission(true),
	permissions: {
		roles: ["Admin", "Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
		channel: [], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
	},
	async execute(interaction) {
		var startTime = new Date().getTime();
		await interaction.deferReply({ content: 'Pong!' });
		await interaction.editReply({
			content: `Pong!  Took \`${new Date().getTime() - startTime
				}ms\` `
		})
	},
};
