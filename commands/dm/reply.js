const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json");
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reply")
        .setDescription("Send a reply for a DM, only one reply per DM ID")
        .setDefaultPermission(true)
        .addStringOption((option) =>
            option
                .setName("dm_id")
                .setDescription("The dm ID to reply to")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("content")
                .setDescription("The message content of the reply")
                .setRequired(true)
        ),
    permissions: {
        roles: [], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
        channel: [" "], //leave empty if any channel can use, or specify a specific channel id by copying the channel id	},
        dm: true,
    },
    async execute(interaction, client) {
        let DmID = interaction.options.getString("dm_id");
        if (DmID.length != 12 || isNaN(DmID)) {
            interaction.reply(
                "Please use a valid 12 Digit numerical Dm ID for your reply."
            );
            return;
        }
        DmID = DmID.toString().trim();
        const response = interaction.options.getString("content");
        const author = client.users.cache.get(interaction.user.id);
        let rawDmData = fs.readFileSync(path.resolve(__dirname, "./dms.json"));
        let dmData = JSON.parse(rawDmData);
        if (
            dmData.hasOwnProperty(DmID) &&
            dmData[DmID].to === author.id
        ) {
            const embed = new Discord.MessageEmbed()
                .setTitle("Reply to Direct Message")
                .setColor("#d34993")
                .setDescription("You have received a response for a DM.")
                .addField("Message", response)
                .addField(`From`,  `${client.users.cache.get(interaction.user.id)}`)
                .addField("Original DM", dmData[DmID].message)
                .addField("Original DM From", `${client.users.cache.get(dmData[DmID].from.id)}`)
                .addField("Original DM Id", DmID)
                .setFooter(
                    `DeltaHacks 8 Discord Bot\n\nReply to this message via this command:\n/dh-dm user:${author} content:<message>`,
                    client.user.displayAvatarURL
                );
            const originalChannel = dmData[DmID].from_channel;
            delete dmData[DmID];
            let dataToWrite = JSON.stringify(dmData);
            fs.writeFileSync(path.resolve(__dirname, "./dms.json"), dataToWrite);
            client.guilds
                .fetch(config.guildId)
                .then((server) => {
                    server.channels.cache.get(originalChannel).send({ embeds: [embed] });
                    interaction.reply("Your reply was sent!");
                })
                .catch(console.error);
            if (config.logging.Discord_Log_Messages) {
                client.channels.cache
                    .get(config.logging.Logging_Channel)
                    .send(
                        `Reply From: ${interaction.user.username} | Content: ${response} | For DM ID: ${DmID}`
                    );
            }
        } else {
            interaction.reply(
                "This Dm ID does not exist. Please contact the support team for more information."
            );
        }
    },
};
