const admin = require("firebase-admin");
const serviceAccount = require("../secrets.json");
const bucket = "DH8";
const config = require("../config.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const Discord = require("discord.js");

module.exports = {
  register: async function registration(interaction, inpcode, client) {
    let server = await client.guilds
      .fetch(config.guildId)
      .then((server) => server)
      .catch(console.error);
    const hasRegisteredRole = await isAlreadyRegisteredRole(interaction, server);
    if (hasRegisteredRole) {
      sendAlreadyRegisteredDM(interaction, server);
      return;
    }
    if (
      inpcode === undefined ||
      inpcode.trim() === "" ||
      inpcode.trim().length != 9
    ) {
      sendCodeInvalidDM(interaction, server);
      return;
    }
    inpcode = inpcode.trim().toUpperCase();
    const codes_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("codes")
      .doc(inpcode);
    const author = interaction.user.id
    codes_db
      .get()
      .then(function (code_doc) {
        if (code_doc.exists) {
          // Code exists in Firebase
          if (code_doc.data().activated) {
            //Check if user is already activated
            if (code_doc.data().discord_id == author) {
              // User activated is the caller
              sendAlreadyRegisteredDM(interaction, server);
              assignRole(author, server, config.allRoles.Hacker);
              return;
            } else {
              // Token has been used by someone who's not the caller
              sendTokenUsedDM(interaction, server);
              return;
            }
          } else {
            // User is not activated
            codes_db.set(
              {
                username: `${interaction.user.username}#${interaction.user.discriminator}`,
                activated: true,
                discord_id: author,
              },
              { merge: true }
            );
            check_in_firebase(interaction, code_doc.data().email, inpcode);
            sendCompletionDM(interaction, server);
            let role_name = code_doc.data().type;
            role_name = role_name.charAt(0).toUpperCase() + role_name.slice(1);
            const role_id = config.allRoles[role_name];
            assignRole(author, server, role_id);
            return;
          }
        } else {
          // Code entered is not available in Firebase
          sendCodeInvalidDM(interaction, server);
        }
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  },
  find: async function find(interaction, data) {
    const snapshot = await db
      .collection(bucket)
      .doc("hackathon")
      .collection("codes")
      .get();
    let found = false;
    foundDoc = undefined
    snapshot.forEach((doc) => {
      if (
        doc.data().discord_id === data ||
        doc.data().email == data ||
        doc.id === data
      ) {
        foundDoc = doc
        found = true;
      }
    });
    if (!found) {
      await interaction.editReply(`${data} not found.`);
    } else {
      let statement="User found.";
      if(foundDoc.data().email){
        statement+=`\nEmail: ${foundDoc.data().email}`
      }
      statement+=`\nCode: ${foundDoc.id}`;
      if(foundDoc.data().type){
        statement+=`\nCategory: ${foundDoc.data().type}`
      }
      if(foundDoc.data().discord_id){
        statement+=`\nUser: <@${foundDoc.data().discord_id}>`
      }
      else{
        statement+=`\nUser not checked in`;
      }
      await interaction.editReply(statement);
    }
  },
  getCodes: async function getCodes(interaction, category) {
    let available = ["judges", "mentors", "sponsors"];

    if (category === undefined || category.trim() === "") {
      interaction.editReply(
        "Category not provided. Usage: /dh-getcodes <category>"
      );
      return;
    }
    category = category.toLowerCase();
    if (!available.includes(category)) {
      interaction.editReply(
        "Invalid category sent. You should know the categories!"
      );
      return;
    }

    try {
      let allDocs = await db
        .collection(bucket)
        .doc("hackathon")
        .collection(category)
        .get();
      let res = [];
      let name = category.charAt(0).toUpperCase() + category.substring(1);
      res.push(`${name} codes: \n`);
      for (let doc of allDocs.docs) {
        let data = doc.data();
        if (!data.code) res.push(`${doc.id}: No Code\n`);
        else {
          let codedoc = await db.collection(bucket).doc('hackathon').collection('codes').doc(data.code).get();
          if (!codedoc.exists || codedoc.data().activated) continue
          res.push(
            `${data.name.first} ${data.name.last} (${doc.id}): ${data.code}\n`
          );
        }
      }

      res.push(
        "\n\nPLEASE BE CAUTIOUS WHEN USING THE COMMAND. DO NOT GIVE SOMEBODY THE WRONG CODE!"
      );
      let fullMessage = res.join("");
      if (fullMessage.length > 2000) {
        console.log("Too many codes to send")
        interaction.editReply(fullMessage.substring(2000))
        return
      }
      else interaction.editReply(res.join(""));
      return;
    } catch (e) {
      console.log(e);
      interaction.editReply(
        "The category has no registered users or something went really wrong."
      );
      return;
    }
  },
}