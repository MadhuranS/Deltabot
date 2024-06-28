# deltabot
To run  
```
npm install  
node app.js
```

| Command | Usage | Purpose | Allowed Roles | Allowed Channels | Category
| -- | -- | -- | -- | -- | -- |
| dm | !dm @mention Message | Send a DM to a mention without revealing identity | Admin, Technical | Any | DM
| reply | !reply DmId Message | Send a reply for a DM. Only one reply per DmId | Anyone | DM only | DM
| help| !help, !info, !about, !commands | Shows help message and dynamic list of commands available to caller's role | Anyone | Any | Info
| stats | !stats | Shows bot statistics | Admin, Technical| Any (#To Change) | Info
| register| !register 8_Digit_Code| Registers hacker by adding "Hacker" role and checks in user to Firebase | Anyone | DM only | Registration
| reset_registration| !reset_registration 8_Digit_Code Original_Email| Resets hacker code,checks out hacker, and removes role for whoever used that code initially | Admin, Technical, Support, Organizer | Any | Registration
| support| !support Your_Issue | Creates Support Ticket | Admin, Technical, Hacker | Any(#To Change) | Support
| open| !open, !open ticket_number | Opens next ticket or specified ticket number | Anyone(#To Change) | Any(#To Change) | Support
| resolve| !resolve ticket_number solution | Resolves support ticket | Admin, Technical(#To Change) | Any(#To Change) | Support
| view| !view, !view ticket_number | Shows support desk status ticket information | Admin, Technical(#To Change) | Any(#To Change) | Support
| reset_support| !reset_support | Resets support desk | Admin, Technical | Any(#To Change) | Support
| group_setup| !group_setup first_group_number last_group_number Category_ID| Makes channels and roles for Hacker groups| Admin, Technical | Any | Misc
| reset_group_setup| !reset_group_setup | Delete presentation channels and roles| Admin, Technical | Any | Misc
| ping| !ping | Responds back with ping | Admin, Technical | Any | Info
| config| !config | Hot Reloads the config file and commands without requiring a bot restart. (Clears all previous rate limit data)  | Admin, Technical | Any | Misc

