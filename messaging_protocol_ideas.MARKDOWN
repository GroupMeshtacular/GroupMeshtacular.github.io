# Federated Decentralized PGP Messaging

braindump: so each instance of meshtastic (ex meshtastic.luc.am) uses a server (or a group of servers) that stores a database of all users and their pgp public keys, and that database is mirrored across all users. and each active user acts like a client and server. however the server will respond to initiation of connections, then reach out to the avaliable users to verify that all the public keys and shit match up
and then for each user to message another, its just as simple as behind the scenes encrypting the message with the other users pgp key and sending the message to all other avaliable users including the user
we could adjust how many users its sent to until its confirm the user recieved the message or some shit
we're basically automating what nerds did 20+ years ago with pgp email
and that way we're not relying on ourselves to implement the important stuff like encryption and signing
what would be cool is if we have it federated too, so you can connect multiple instances together