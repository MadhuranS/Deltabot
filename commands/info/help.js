const Discord = require("discord.js");
const config = require("../../config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Replies with help message and dynamic list of commands available to your role in that channel")
        .setDefaultPermission(true),
    permissions: {
        roles: [], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
        channel: [], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
        dm: true,
    },

    execute(interaction, client) {
        if (!interaction.inGuild()) {
            try {
                const embed = new Discord.MessageEmbed()
                    .setTitle("Here to help")
                    .setDescription("Hi, welcome to DH8!")
                    .addField(
                        `Available Commands`,
                        "`/help`\n`/support`\n`/register`\n`/reply`"
                    )
                    .addField(
                        "Support",
                        "Need help? Send me a dm with /support <Your issue> and our team will get back to you ASAP." // This shouldn't be hard coded
                    )
                    .setColor("#d34993");
                interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.log(error);
            }
        } else {
            let cmdList = [];
            for (const [key, value] of client.commands) {
              let isMaster = is_Master(interaction);
              let isRoleAllowed = is_Role_Allowed(interaction, value);
              let isAllowedInChannel = is_Allowed_In_Channel(interaction, value);
              if (
                !value.hidden &&
                ((isRoleAllowed || isMaster) && isAllowedInChannel)
              ) {
                // cmdList.push(" !"+key+"");
                cmdList.push("`/" + key + "`");
              }
            }
            cmdStr = cmdList.join(", ");
            // const cmdStr = client.commands.map(c => `\`${c.name}\``).join();
            try {
              const embed = new Discord.MessageEmbed()
                .setTitle("Here to help")
                .setDescription("Hi, welcome to DH8!")
                .addField(`DM Commands Available`, "`/help`\n`/support`\n`/register`\n`/reply`")
                .addField(`Channel Commands Available`, `Channel: <#${interaction.channel.id}> on ${interaction.guild} server\n\n${cmdStr}`)
                .addField(
                  "Support",
                  "Need help? Send me a message with /support <Your issue> and our team will get back to you ASAP." // This shouldn't be hard coded
                )
                .setColor("#d34993");
              interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
              console.log(error);
            }
        }
    },
};

function is_Master(interaction) {
    let role_id = new Set();
    config.allRoles.Master.forEach((item) => role_id.add(config.allRoles[item]));
    for (const [key, value] of interaction.member.roles.cache.entries()) {
      if (role_id.has(key) || role_id.has("All")) {
        return true;
      }
    }
    return false;
  }
  
  function is_Role_Allowed(interaction, command) {
    let role_id = new Set();
    command.permissions.roles.forEach((item) => role_id.add(config.allRoles[item]));
    for (const [key, value] of interaction.member.roles.cache.entries()) {
      if (role_id.has(key) || role_id.has("All")) {
        return true;
      }
    }
    if (command.permissions.roles.length === 0) {
        return true
    } 
    return false;
  }
  
  function is_Allowed_In_Channel(interaction, command) {
      for (let channel of command.permissions.channel) {
          if (config.allChannels[channel] === interaction.channel.id) {
              return true;
          }
      }
      if (command.permissions.channel.length === 0) {
          return true
      } 
      return false;
  }
  