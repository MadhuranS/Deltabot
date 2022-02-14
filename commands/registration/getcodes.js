const { SlashCommandBuilder } = require('@discordjs/builders');
const Firebase = require("../../handlers/firebase.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dh-getcodes')
		.setDescription('Gets all codes for judges/mentors/sponsors')
		.setDefaultPermission(true)
        .addStringOption(option => 
            option.setName("category")
            .setDescription('Category that user belongs to')
            .addChoice('judges', 'judges')
            .addChoice('mentors', 'mentors')
            .addChoice('sponsors', 'sponsors')
            .setRequired(true)
        ),
	permissions: {
		roles: ["Admin", "Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
		channel: ["secret"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
    },
    async execute(interaction) {
        const category = interaction.options.getString("category");
        await interaction.deferReply()
		Firebase.getCodes(interaction, category)

	},
};
