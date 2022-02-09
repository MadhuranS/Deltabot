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
}