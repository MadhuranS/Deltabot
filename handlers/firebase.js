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
  reset_registration: async function reset_registration(
    interaction,
    inpcode,
    inp_email
  ) {
    if (
      inpcode === undefined ||
      inpcode.trim() === "" ||
      inpcode.trim().length != 9
    ) {
      interaction.editReply("Invalid code. Please fix format.");
      return;
    }
    if (inp_email === undefined || inp_email.trim() === "") {
      interaction.editReply("Invalid email. Please fix format.");
      return;
    }
    inpcode = inpcode.trim().toUpperCase();
    inp_email = inp_email.trim().toLowerCase();
    const codes_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("codes")
      .doc(inpcode);
    codes_db
      .get()
      .then(function (code_doc) {
        if (code_doc.exists) {
          // Code exists in Firebase
          if (code_doc.data().activated) {
            //Check if user is already activated
            if (code_doc.data().email.trim().toLowerCase() == inp_email) {
              removeAllRoles(interaction, code_doc.data().discord_id);
              codes_db.set(
                {
                  username: null,
                  activated: false,
                  discord_id: null,
                },
                { merge: true }
              );
              check_out_firebase(code_doc.data().email);
              interaction.editReply("Code is ready to be used again, removed all user roles");
            } else {
              interaction.editReply(
                "Email entered is invalid. This code was assigned to: " +
                code_doc.data().email
              );
            }
          } else {
            // User is not activated
            interaction.editReply("Code is not activated.");
          }
        } else {
          interaction.editReply("The code " + inpcode + " does not exist.");
        }
      })
      .catch(function (error) {
        // message.channel.send("This ticket: " + ticket_code + " does not exist.");
        console.log("Error getting document:", error);
      });
  },
  create_ticket: async function create_ticket(interaction, issue, client) {
    let server = await client.guilds
      .fetch(config.guildId)
      .then((server) => server)
      .catch(console.error);
    let ticket_code = getRandomCode();
    const support_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("support");
    support_db
      .doc("manager")
      .get()
      .then(function (support_doc) {
        let pending = support_doc.data().pending;
        let resolving = support_doc.data().resolving;
        let resolved = support_doc.data().resolved;
        while (
          pending.includes(ticket_code) ||
          resolving.includes(ticket_code) ||
          resolved.includes(ticket_code)
        ) {
          ticket_code = getRandomCode();
        }
        pending.push(ticket_code);
        support_db.doc(ticket_code).set({
          caller: `${interaction.user.username}#${interaction.user.discriminator}`,
          status: "pending",
          issue: issue,
          discord_id: interaction.user.id,
        });
        support_db.doc("manager").update({
          pending: pending,
        });
        sendSupportTicket(interaction, ticket_code, issue, server, client);
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  },
  open_ticket: async function open_ticket(interaction, ticket_code) {
    const support_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("support");
    support_db
      .doc("manager")
      .get()
      .then(function (support_doc) {
        let pending = support_doc.data().pending;
        let resolving = support_doc.data().resolving;
        let resolved = support_doc.data().resolved;
        if (ticket_code != null) {
          ticket_code = ticket_code.toString().trim();
        } else {
          ticket_code = pending[0];
          if (pending.length == 0) {
            interaction.editReply("No tickets to resolve!");
            return;
          }
        }
        if (
          !pending.includes(ticket_code) &&
          !resolving.includes(ticket_code) &&
          !resolved.includes(ticket_code)
        ) {
          interaction.editReply(
            "The ticket: " + ticket_code + " does not exist."
          );
          return;
        }
        if (resolving.includes(ticket_code)) {
          interaction.editReply(
            "The ticket:" + ticket_code + " is already open."
          );
          return;
        }
        pending = pending.filter((item) => item !== ticket_code);
        resolved = resolved.filter((item) => item !== ticket_code);
        resolving.push(ticket_code);
        support_db.doc(ticket_code).update(
          {
            assigned_to: `${interaction.member.user.username}#${interaction.member.user.discriminator}`,
            status: "in progress",
          },
          { merge: true }
        );
        support_db.doc("manager").update({
          pending: pending,
          resolving: resolving,
          resolved: resolved,
        });
        support_db
          .doc(ticket_code)
          .get()
          .then(function (ticket_doc) {
            let requester = ticket_doc.data().discord_id;
            let issue = ticket_doc.data().issue;
            sendOpenedTicket(interaction, ticket_code, issue, requester);
          })
          .catch(function (error) {
            interaction.editReply(
              "The ticket: " + ticket_code + " does not exist."
            );
            return;
          });
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  },
  resolve: async function resolve_ticket(interaction, ticket_code, resolution) {
    const support_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("support");
    support_db
      .doc("manager")
      .get()
      .then(function (support_doc) {
        ticket_code = ticket_code.toString().trim();
        let pending = support_doc.data().pending;
        let resolving = support_doc.data().resolving;
        let resolved = support_doc.data().resolved;
        if (resolved.includes(ticket_code)) {
          interaction.editReply(
            "The ticket:" + ticket_code + " has already been resolved."
          );
          return;
        }
        if (
          !pending.includes(ticket_code) &&
          !resolving.includes(ticket_code) &&
          !resolved.includes(ticket_code)
        ) {
          interaction.editReply(
            "The ticket: " + ticket_code + " does not exist."
          );
          return;
        }
        pending = pending.filter((item) => item !== ticket_code);
        resolving = resolving.filter((item) => item !== ticket_code);
        resolved.push(ticket_code);
        support_db.doc(ticket_code).update(
          {
            assigned_to: `${interaction.member.user.username}#${interaction.member.user.discriminator}`,
            status: "resolved",
            resolution: resolution,
          },
          { merge: true }
        );
        support_db.doc("manager").update({
          pending: pending,
          resolving: resolving,
          resolved: resolved,
        });
        sendResolvedMessage(interaction, ticket_code, resolution);
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  },
  view_ticket: async function view_ticket(interaction, ticket_code, user) {
    const support_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("support");
    if (ticket_code == null) {
      if (user != null) {
        let tickets = { "in progress": [], "resolved": [] };
        let found = false;
        const snapshot = await support_db.get();
        snapshot.forEach((doc) => {
          if (
            doc.id != "manager" &&
            doc.data().assigned_to != undefined &&
            doc.data().assigned_to === `${user.username}#${user.discriminator}`
          ) {
            tickets[doc.data().status].push(doc.id);
            found = true;
          }
        });
        if (!found) {
          interaction.editReply("No tickets assigned to: @" + user.tag);
          return;
        }
        else {
          interaction.editReply(`Tickets assigned to: @${user.tag}\nOpen - ${(tickets["in progress"]).length} :\n${tickets["in progress"].join("\n")}\n\nResolved - ${(tickets["resolved"]).length} :\n${tickets["resolved"].join("\n")}`);
          return;
        }
      } else {
        support_db
          .doc("manager")
          .get()
          .then(function (support_doc) {
            let pending = support_doc.data().pending;
            let len1 = 0;
            let len2 = 0;
            let len3 = 0;
            if (pending.length == 0) {
              pending = ["None"];
            } else {
              len1 = pending.length;
              pending = pending.slice(0, 3);
              if (len1 > 3) {
                let len = len1 - 3;
                pending.push("And " + len + " more ...");
              }
            }
            let resolving = support_doc.data().resolving;
            if (resolving.length == 0) {
              resolving = ["None"];
            } else {
              len2 = resolving.length;
              resolving = resolving.slice(0, 3);
              if (len2 > 3) {
                let len = len2 - 3;
                resolving.push("And " + len + " more ...");
              }
            }
            let resolved = support_doc.data().resolved;
            if (resolved.length == 0) {
              resolved = ["None"];
            } else {
              len3 = resolved.length;
              resolved = resolved.slice(0, 3);
              if (len3 > 3) {
                let len = len3 - 3;
                resolved.push("And " + len + " more ...");
              }
            }
            const Embed = new Discord.MessageEmbed()
              .setTitle("Support Ticket Status")
              .setDescription(`Current Status for Live Support Desk`)
              .addField("Pending: " + len1.toString(), pending.toString())
              .addField("Resolving: " + len2.toString(), resolving.toString())
              .addField("Resolved: " + len3.toString(), resolved.toString())
              .setColor("#d34993")
              .setThumbnail(interaction.guild.iconURL());
            interaction.editReply({ embeds: [Embed] });
          })
          .catch(function (error) {
            console.log("Error getting document:", error);
          });
      }
    } else {
      ticket_code = ticket_code.toString().trim();
      support_db
        .doc(ticket_code)
        .get()
        .then(function (ticket_doc) {
          assigned = ticket_doc.data().assigned_to;
          if (assigned == undefined) {
            assigned = "Not assigned to anyone"
          }
          resolution = ticket_doc.data().resolution;
          if (resolution == undefined) {
            resolution = "Not resolved yet"
          }
          const Embed = new Discord.MessageEmbed()
            .setTitle("Support Ticket Status")
            .setDescription(`Status for Ticket`)
            .addField("Ticket Number", ticket_code)
            .addField("Requester", `<@${ticket_doc.data().discord_id}>`)
            .addField("Status", ticket_doc.data().status)
            .addField("Assigned To", assigned)
            .addField("Issue", ticket_doc.data().issue)
            .addField("Resolution", resolution)
            .setColor("#d34993")
            .setThumbnail(interaction.guild.iconURL());
          interaction.editReply({ embeds: [Embed] });
        })
        .catch(function (error) {
          interaction.editReply(
            "The ticket: " + ticket_code + " does not exist."
          );
        });
    }
  },
  reset_support: async function reset_support(interaction) {
    const support_db = db
      .collection(bucket)
      .doc("hackathon")
      .collection("support");
    deleteCollection(db, support_db, 500).then((result) => {
      if (result) {
        support_db.doc("manager").set({
          pending: [],
          resolving: [],
          resolved: [],
        });
        interaction.editReply("Support Reset");
      } else {
        reset_support(interaction);
      }
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