const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json")
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dh-dm")
        .setDescription("Send a DM to a mention without revealing your identity")
        .setDefaultPermission(true)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to dm")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("content")
                .setDescription("The message content of the dm")
                .setRequired(true)
        ),
    permissions: {
        roles: ["Admin", "Technical", "Organizer", "Moderator"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
        channel: ["support"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id	},
    },
    async execute(interaction, client) {
        const target = interaction.options.getUser("user");
        const author = client.users.cache.get(interaction.member.user.id);
        const content = interaction.options.getString("content");
        const user = client.users.cache.get(target.id);
        let rawDmData = fs.readFileSync(path.resolve(__dirname, "./dms.json"));
        let dmData = JSON.parse(rawDmData);
        let messageid = getRandomCode();
        while (dmData.hasOwnProperty(messageid)) {
            messageid = getRandomCode();
        }
        const embed = new Discord.MessageEmbed()
            .setTitle("Direct Message")
            .setColor("#d34993")
            .setDescription(
                "You have received a DM from the DeltaHacks 8 Team!"
            )
            .addField("Message", content)
            .setFooter(
                `DeltaHacks 8 Discord Bot - \nDM ID: ${messageid}\n\nReply to this message via this command:\n/reply dm_id:${messageid} content:<message>\n(You can only send one reply per DM ID)`,
                client.user.displayAvatarURL
            );
        dmData[messageid] = {
            from: author,
            to: target.id,
            message: content,
            from_channel: interaction.channelId,
        };
        let dataToWrite = JSON.stringify(dmData);
        fs.writeFileSync(path.resolve(__dirname, "./dms.json"), dataToWrite);

        await user.send({ embeds: [embed] });
        await interaction.reply({
            content: `DM sent to: ${target} | From: ${author
                } " with ID: ${messageid}`,
            ephemeral: false,
        });
        if (config.logging.Discord_Log_Messages) {
            client.channels.cache
                .get(config.logging.Logging_Channel)
                .send(
                    `DM From: ${author
                    } | To: ${target} | Content: ${content} | Dm ID: ${messageid}`
                );
        }
    },
};

function getRandomCode() {
    min = 100000000000;
    max = 999999999999;
    return Math.floor(Math.random() * (max - min) + min).toString(); //The maximum is exclusive and the minimum is inclusive
}
