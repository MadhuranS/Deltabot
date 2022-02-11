const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dh-config")
    .setDescription("Reloads the bot commands config files without requiring a restart")
    .setDefaultPermission(true)
    .addBooleanOption((option) =>
      option
        .setName("discord_log")
        .setDescription("Enable discord logging")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("file_log")
        .setDescription("Enable logging to json file")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("console_log")
        .setDescription("Enable console logging")
        .setRequired(false)
    ),
  permissions: {
    roles: ["Admin", "Technical"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
    channel: ["tech"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id	},
  },
  async execute(interaction, client) {
    const discord_log = interaction.options.getBoolean("discord_log");
    const file_log = interaction.options.getBoolean("file_log");
    const console_log = interaction.options.getBoolean("console_log");

    let rawConfig = fs.readFileSync(path.resolve(__dirname, "../../config.json"));
    let config = JSON.parse(rawConfig);
    if (discord_log != undefined) {
      if (discord_log) {
        config["logging"]["Discord_Log_Messages"] = true;
      } else {
        config["logging"]["Discord_Log_Messages"] = false;
      }
    }

    if (file_log != undefined) {
      if (file_log) {
        config["logging"]["File_Log_Messages"] = true;
      } else {
        config["logging"]["File_Log_Messages"] = false;
      }
    }

    if (console_log != undefined) {
      if (console_log) {
        config["logging"]["Console_Log_Messages"] = true;
      } else {
        config["logging"]["Console_Log_Messages"] = false;
      }
    }

    fs.writeFileSync(path.resolve(__dirname, "../../config.json"), JSON.stringify(config));
    interaction.reply(`Configuration updated. 
    Logging:
    \tDiscord: ${config["logging"]["Discord_Log_Messages"]}
    \tFile: ${config["logging"]["File_Log_Messages"]}
    \tConsole: ${config["logging"]["Console_Log_Messages"]}
    Support Channel: <#${config["logging"]["Support"]}>
    Logging Channel: <#${config["logging"]["Logging_Channel"]}>
    `);
    return config;
  },
};
