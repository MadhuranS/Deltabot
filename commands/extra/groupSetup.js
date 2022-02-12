const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dh-group-setup")
        .setDescription(`Setup discord groups`)
        .setDefaultPermission(true)
        .addIntegerOption((option) =>
            option
                .setName("first_group_number")
                .setDescription("The first group number in the threshold")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("last_group_number")
                .setDescription("The last group number in the threshold")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("categoryid")
                .setDescription(
                    "ID for the category which the channels fall under"
                )
                .setRequired(true)
        ),
    permissions: {
        roles: ["Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
        channel: ["tech"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
    },
    async execute(interaction) {
        await interaction.deferReply();
        let beginningOfLoop =
            interaction.options.getInteger("first_group_number");
        let endOfLoop = interaction.options.getInteger("last_group_number");

        if (
            beginningOfLoop >= endOfLoop ||
            isNaN(beginningOfLoop) ||
            isNaN(endOfLoop)
        ) {
            interaction.editReply("Invalid Group Numbers");
            return;
        }
        const categoryID = interaction.options.getString("categoryid");

        for (let i = beginningOfLoop; i < endOfLoop; i++) {
            interaction.guild.channels
                .create(`Group ${i + 1}`, { type: "GUILD_VOICE" })
                .then((channel) => {
                    interaction.guild.roles
                        .create(
                            {
                                name: `Group ${i + 1}`,
                                color: "ORANGE",
                            })
                        .then((role) => {
                            channel.permissionOverwrites.set([
                                {
                                    id: channel.guild.roles.everyone,
                                    deny: ["VIEW_CHANNEL"],
                                },
                                {
                                    id: role,
                                    allow: ["VIEW_CHANNEL"],
                                },
                            ]);
                        });

                    channel.setParent(categoryID); // ID for the category which the channels fall under
                });
        }
        interaction.editReply("Done setting up groups")
    },
};
