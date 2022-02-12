const { SlashCommandBuilder } = require("@discordjs/builders");

const Firebase = require("../../handlers/firebase.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dh-reset-group-setup")
        .setDescription(`reset discord groups`)
        .setDefaultPermission(true),
    permissions: {
        roles: ["Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
        channel: ["tech"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
    },
    async execute(interaction) {
        await interaction.deferReply();
        // Deleting Roles
        const roles = interaction.guild.roles.cache;
        const groupRoles = roles.filter((role) => role.name.includes("Group"));
        for (const [key, value] of groupRoles) {
            const fetchedRole = interaction.guild.roles.cache.get(value.id);
            fetchedRole.delete();
        }

        // Deleting Channels
        const channels = interaction.guild.channels.cache;
        const groupChannels = channels.filter((channel) =>
            channel.name.includes("Group")
        );
        for (const [key, value] of groupChannels) {
            const fetchedChannel = interaction.guild.channels.cache.get(
                value.id
            );
            fetchedChannel.delete();
        }
        interaction.editReply("Done resetting groups")
    },
};
