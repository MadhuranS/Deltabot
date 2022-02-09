const { SlashCommandBuilder } = require('@discordjs/builders');

const Firebase = require("../../handlers/firebase.js");

module.exports = {
data: new SlashCommandBuilder()
    .setName('dh-find')
    .setDescription(`Responds back with user data if user is checked in`)
    .setDefaultPermission(true)
    .addUserOption(option => 
        option.setName("user")
        .setDescription('The user to find')
        .setRequired(false)
    ).addStringOption(option => 
      option.setName("emailorcode")
      .setDescription("The email or code to find")
      .setRequired(false)
    ),
  permissions: {
    roles: ["Admin", "Technical", "Moderator", "Organizer"], //leave empty if anyone can access, or specify roles using the roles given in the config, ex: "Technical"
    channel: ["support"], //leave empty if any channel can use, or specify a specific channel id by copying the channel id
  },
  async execute(interaction) {
    await interaction.deferReply()
    const user = interaction.options.getUser("user")
    const emailOrCode = interaction.options.getString("emailorcode")

    if (!user && !emailOrCode) {
      interaction.editReply("Please enter either a user as a user property or an email or code as an emailorcode property")
      return
    }

    if (user && emailOrCode) {
      interaction.editReply("Please enter only a user as a user property or an email or code as an emailorcode property")
      return
    }

    let data = null

    if (user) {
      data = user.id
    } else {
      data = emailOrCode
    }
    Firebase.find(interaction, data);
  },
};