// const express = require('express');
// const router = express.Router();
const User = require("../schemas/schema.js");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// POST (because get requests don't allow a body)
// Fetch user data using userId, if user does not exist then create a new user
// const getUserData = async (req, res) => {
//   const { userId } = req.body;
//   if (!userId) {
//     res.status(400).send({ error: "userId field is missing." });
//     return;
//   }
//   try {
//     console.log(`Searching for user with userId: ${userId}`);
//     let user = await User.findOne({ userId });
//     // check if the user exists
//     if (!user) {
//       const newUser = new User({
//         userId: userId,
//         tickets: [],
//         assignedTickets: [],
//       });
//       console.log(`UserId not found, adding new user with userId: ${userId}`);
//       user = new User(newUser);
//       await user.save();
//       console.log(`New user added: ${JSON.stringify(user, null, 2)}`);
//     } else {
//       console.log(`Found a user with userId: ${userId}`);
//     }

//     res.status(200).send({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

const getUserData = async (req, res) => {
  const { userId, userName } = req.body;
  if (!userId) {
    res.status(400).send({ error: "userId field is missing." });
    return;
  }
  try {
    // console.log(`Searching for user with userId: ${userId}`);
    let user = await User.findOne({ userId });

    // check if the user exists
    if (!user) {
      const newUser = new User({
        userId: userId,
        userName: userName,
        tickets: [],
        assignedTickets: [],
      });
      console.log(`UserId not found, adding new user with userId: ${userId}`);
      user = new User(newUser);
      await user.save();
      console.log(`New user added: ${JSON.stringify(user, null, 2)}`);
    } else {
      // console.log(`Found a user with userId: ${userId}`);
    }

    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

// Helper function to retrieve attachment data from GridFS
// const getAttachmentData = async (tickets) => {
//   const attachmentData = {};

//   for (const ticket of tickets) {
//     attachmentData[ticket.internal_id.toString()] = [];
//     if (ticket.attachments && ticket.attachments.length > 0) {
//       for (const attachment of ticket.attachments) {
//         const fileId = attachment.fileId; // Assume you have fileId stored in attachments
//         attachmentData[ticket.internal_id.toString()].push(fileId);
//       }
//     }
//   }

//   return attachmentData;
// };

// POST
// Add a new ticket for this userId to their tickets list
// const addNewTicket = async (req, res) => {
//   const { userId, ticket } = req.body;
//   if (!userId || !ticket) {
//     res.status(400).send({ error: "All fields are required." });
//     return;
//   }
//   const ticket_title = ticket.title; // check if this ticket at least has a title
//   if (!ticket_title) {
//     res.status(400).send({ error: "Ticket title is required." });
//     return;
//   }
//   try {
//     let user = await User.findOne({ userId });
//     if (!user) {
//       res.status(404).send({ error: "User not found." });
//       return;
//     }

//     const newTicket = {
//       internal_id: new mongoose.Types.ObjectId(),
//       title: ticket.title,
//       description: ticket.description,
//       uuid: ticket.uuid,
//       id: ticket.id,
//       category: ticket.category,
//       ticket_status: {
//         status_title: ticket.ticket_status.status_title,
//         color: ticket.ticket_status.color,
//       },
//       users: ticket.users,
//       attachments: ticket.attachments,
//     };

//     console.log(`Adding new ticket for user with userId: ${user.userId}`);
//     user.addNewTicket(newTicket);
//     console.log(`New ticket added: ${JSON.stringify(ticket, null, 2)}`);
//     // user = await User.findOne({ userId });
//     res.status(200).send({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

// POST
// get ticket attachments for a specific ticket
const getTicketFiles = async (req, res) => {
  const { userId, ticketId } = req.body;
  console.log("Received request:", req.body);
  if (!userId || !ticketId) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }
  try {
    let user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    const ticket = user.tickets.find((ticket) =>
      ticket.internal_id.equals(new ObjectId(ticketId))
    );

    if (!ticket) {
      res.status(404).send({ error: "Ticket not found." });
      return;
    }

    console.log(
      `Getting attachments for ticket with internal_id ${ticketId} for user with userId: ${user.userId}`
    );

    const bucket = new mongoose.mongo.GridFSBucket(user.db.db, {
      bucketName: "attachments",
    });

    const filePromises = ticket.attachments.map(async (attachment) => {
      return new Promise((resolve, reject) => {
        const downloadStream = bucket.openDownloadStreamByName(
          attachment.filename
        );

        let fileData = "";
        downloadStream.on("data", (chunk) => {
          fileData += chunk.toString("base64");
        });

        downloadStream.on("end", () => {
          attachment.data = fileData;
          resolve(attachment);
        });

        downloadStream.on("error", (error) => {
          reject(error);
        });
      });
    });

    const files = await Promise.all(filePromises);

    res.status(200).send({ files });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
  }
};

// chatgpt provided code for handling file attachments
const addNewTicket = async (req, res) => {
  const { userId, ticket } = req.body;
  const files = req.files;

  console.log("Received request:", req.body);

  if (!userId || !ticket) {
    res.status(400).send({ error: "User ID and ticket data are required." });
    return;
  }

  // Parse the ticket field as JSON
  const parsedTicket = JSON.parse(ticket);

  const {
    title,
    description,
    uuid,
    id,
    category,
    ticket_status,
    users,
    attachments,
  } = parsedTicket;

  if (!title) {
    res.status(400).send({ error: "Ticket title is required." });
    return;
  }

  try {
    let user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    const newTicket = {
      internal_id: new mongoose.Types.ObjectId(),
      title,
      description,
      uuid,
      id,
      category,
      ticket_status: {
        status_title: ticket_status.status_title,
        color: ticket_status.color,
      },
      users,
      attachments: [], // Initialize empty array for attachments
    };

    // Process attachments using GridFS
    if (files && files.length > 0) {
      for (const file of files) {
        const bucket = new mongoose.mongo.GridFSBucket(user.db.db, {
          bucketName: "attachments",
        });

        const attachment = {
          filename: file.originalname,
          contentType: file.mimetype,
        };

        const uploadStream = bucket.openUploadStream(attachment.filename);
        uploadStream.end(file.buffer);

        newTicket.attachments.push(attachment);
      }
    }

    console.log(`Adding new ticket for user with userId: ${user.userId}`);
    user.addNewTicket(newTicket);
    console.log(`New ticket added: ${JSON.stringify(newTicket, null, 2)}`);
    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
  }
};

// PATCH
// Update a ticket for this userId and ticketId
const updateTicket = async (req, res) => {
  const { userId, ticketId, updatedTicket } = req.body;
  if (!userId || !ticketId || !updatedTicket) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }
  try {
    let user = await User.findOne({ userId }); // Fetch the user data with this ID
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }
    const ticket = user.tickets.find((ticket) =>
      ticket.internal_id.equals(new ObjectId(ticketId))
    ); // Fetch the ticket data with this ID
    if (!ticket) {
      res.status(404).send({ error: "Ticket not found." });
      return;
    }
    console.log(
      `Updating ticket with internal_id ${ticketId} for user with userId: ${user.userId}`
    );

    const updatedTicket_for_DB = {
      internal_id: ticket.internal_id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      uuid: updatedTicket.uuid,
      id: updatedTicket.id,
      category: updatedTicket.category,
      ticket_status: {
        status_title: updatedTicket.ticket_status.status_title,
        color: updatedTicket.ticket_status.color,
      },
      users: updatedTicket.users,
      attachments: updatedTicket.attachments,
    };
    user.updateTicket(ticketId, updatedTicket_for_DB);
    console.log(`Ticket updated: ${JSON.stringify(updatedTicket, null, 2)}`);
    // user = await User.findOne({ userId });
    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

// const updateTicket = async (req, res) => {
//   const { userId, ticketId, updatedTicket } = req.body;
//   const files = req.files;
//   console.log("Received request:", req.body);
//   if (!userId || !ticketId || !updatedTicket) {
//     res.status(400).send({ error: "All fields are required." });
//     return;
//   }

//   const parsedTicket = JSON.parse(updatedTicket);

//   const {
//     title,
//     description,
//     uuid,
//     id,
//     category,
//     ticket_status,
//     users,
//     attachments,
//   } = parsedTicket;

//   console.log("Parsed ticket:", parsedTicket);

//   try {
//     let user = await User.findOne({ userId });
//     if (!user) {
//       res.status(404).send({ error: "User not found." });
//       return;
//     }

//     const ticket = user.tickets.find((ticket) =>
//       ticket.internal_id.equals(new ObjectId(ticketId))
//     );

//     if (!ticket) {
//       res.status(404).send({ error: "Ticket not found." });
//       return;
//     }

//     console.log(
//       `Updating ticket with internal_id ${ticketId} for user with userId: ${user.userId}`
//     );

//     const updatedTicket_for_DB = {
//       internal_id: ticket.internal_id,
//       title: title,
//       description: description,
//       uuid: uuid,
//       id: id,
//       category: category,
//       ticket_status: {
//         status_title: ticket_status.status_title,
//         color: ticket_status.color,
//       },
//       users: users,
//       attachments: [],
//     };

//     // Process attachments using GridFS
//     if (files && files.length > 0) {
//       for (const file of files) {
//         const bucket = new mongoose.mongo.GridFSBucket(user.db.db, {
//           bucketName: "attachments",
//         });

//         const attachment = {
//           filename: file.originalname,
//           contentType: file.mimetype,
//         };

//         const uploadStream = bucket.openUploadStream(attachment.filename);
//         uploadStream.end(file.buffer); // Use file.buffer instead of fs.createReadStream

//         // Check if the attachment with the same filename already exists
//         const existingAttachment = updatedTicket_for_DB.attachments.find(
//           (existing) => existing.filename === attachment.filename
//         );

//         if (existingAttachment) {
//           console.log("Attempted to upload duplicate attachment.");
//           res.status(400).send({ error: "Duplicate attachment." });
//         } else {
//           // Add the new attachment
//           updatedTicket_for_DB.attachments.push(attachment);
//         }
//       }

//       // Remove deleted attachments
//       updatedTicket_for_DB.attachments =
//         updatedTicket_for_DB.attachments.filter((existing) => {
//           const updatedAttachment = attachments.find(
//             (updated) => updated.filename === existing.filename
//           );
//           return !!updatedAttachment;
//         });
//     }

//     user.updateTicket(ticketId, updatedTicket_for_DB);

//     console.log(
//       `Ticket updated: ${JSON.stringify(updatedTicket_for_DB, null, 2)}`
//     );

//     res.status(200).send({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

// DELETE
// Delete a ticket for this userId and ticketId
// const deleteTicket = async (req, res) => {
//   const { userId, ticketId } = req.body;
//   if (!userId || !ticketId) {
//     res.status(400).send({ error: "All fields are required." });
//     return;
//   }
//   try {
//     let user = await User.findOne({ userId }); // Fetch the user data with this ID
//     if (!user) {
//       res.status(404).send({ error: "User not found." });
//       return;
//     }
//     const ticket = user.tickets.find((ticket) =>
//       ticket.internal_id.equals(new ObjectId(ticketId))
//     ); // Fetch the ticket data with this ID
//     if (!ticket) {
//       res.status(404).send({ error: "Ticket not found." });
//       return;
//     }
//     console.log(
//       `Deleting ticket for user with userId: ${user.userId}, ticketId: ${ticketId}`
//     );
//     user.deleteTicket(ticketId);
//     // user = await User.findOne({ userId }); // get the new user data and return it
//     res.status(200).send({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

const deleteTicket = async (req, res) => {
  const { userId, ticketId } = req.body;
  if (!userId || !ticketId) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }

  try {
    let user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    const ticket = user.tickets.find((ticket) =>
      ticket.internal_id.equals(new ObjectId(ticketId))
    );

    if (!ticket) {
      res.status(404).send({ error: "Ticket not found." });
      return;
    }

    console.log(
      `Deleting ticket for user with userId: ${user.userId}, ticketId: ${ticketId}`
    );

    // Assuming your User model has a method like `deleteAttachments` to handle file deletions
    // user.deleteAttachments(ticketId); // BROKEN

    // Assuming your User model has a method like `deleteTicket` to handle ticket deletions
    user.deleteTicket(ticketId);

    console.log(`Ticket deleted: ${ticketId}`);

    // You might want to add additional logic to delete the attachments from GridFS here

    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

const userSearch = async (req, res) => {
  const { searchQuery } = req.body;
  if (!searchQuery) {
    res.status(400).send({ error: "Search query is required." });
    return;
  }

  try {
    // Find all users whose userName matches the search query
    const users = await User.find(
      { userName: { $regex: new RegExp(searchQuery, "i") } }, // Case-insensitive search
      { userId: 1, userName: 1, _id: 0 } // Projection: Include only userId and userName
    );

    console.log(`Autocompleting user search for searchQuery: ${searchQuery}`);
    console.log(`User search results: ${users}`);

    res.status(200).send({ users });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

const assignUser = async (req, res) => {
  const { assignedUserId, ticketId } = req.body;
  console.log("Received user assign request:", req.body);
  if (!assignedUserId || !ticketId) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }

  try {
    // Check if user exists
    const userId = assignedUserId;
    let user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    // Check if ticket exists
    const ticket = await User.find({
      tickets: { $elemMatch: { internal_id: ticketId } },
    });
    console.log("found ticket for assignment", ticket);

    if (!ticket) {
      res.status(404).send({ error: "Ticket not found." });
      return;
    }

    // Check if the user is already assigned to the ticket
    const assignedTicket = user.assignedTickets.find((ticket) =>
      ticket.internal_id.equals(ticketId)
    );
    console.log("assignedTicket", assignedTicket);

    if (assignedTicket) {
      // res
      //   .status(400)
      //   .send({ error: "User is already assigned to this ticket." });
      res
        .status(200)
        .send({ Warning: "User is already assigned to this ticket." });
      return;
    }

    console.log(
      `Assigning ticket for user with userId: ${user.userId}, ticketId: ${ticketId}`
    );
    // Assign the ticket to the user, by adding the ticketId to the user's assignedTickets array
    const ticketToAssign = { internal_id: ticketId };
    user.assignTicket(ticketToAssign);

    console.log(`Ticket assigned: ${ticketId}`);

    res.status(200).send({ Success: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

const unassignUser = async (req, res) => {
  const { assignedUserId, ticketId } = req.body;
  if (!assignedUserId || !ticketId) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }

  try {
    // check if the user exists
    const userId = assignedUserId;
    let user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    // check if the user has an assigned ticket with this ID
    const ticket = user.assignedTickets.find((ticket) =>
      ticket.internal_id.equals(ticketId)
    );

    if (!ticket) {
      res.status(404).send({ error: "Ticket not found." });
      return;
    }

    console.log(
      `Unassigning ticket for user with userId: ${user.userId}, ticketId: ${ticketId}`
    );

    user.unassignTicket(ticketId, assignedUserId);

    console.log(`Ticket unassigned: ${ticketId}`);

    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

const getAssignedTickets = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).send({ error: "userId field is missing." });
    return;
  }
  try {
    // console.log(`Searching for user with userId: ${userId}`);
    let user = await User.findOne({ userId });
    // check if the user exists
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    } else {
      // console.log(`Found a user with userId: ${userId}`);
    }

    const assignedTickets = user.assignedTickets;
    let assignedTicketsData = []; // actual ticket data
    let originalUsers = []; // userIds of the original users who created the tickets
    console.log(`ASSIGNED TICKETS: ${assignedTickets}`);
    for (const ticket of assignedTickets) {
      let a_Ticket = await User.findOne({
        "tickets.internal_id": ticket.internal_id,
      });

      // console.log(
      //   `found assigned ticket data: ${a_Ticket} for ticket ${ticket}`
      // );
      if (a_Ticket) {
        // Use $elemMatch to filter the correct ticket from the array
        let matchingTicket = a_Ticket.tickets.find(
          (t) => t.internal_id.toString() === ticket.internal_id.toString()
        );

        assignedTicketsData.push(matchingTicket);
        originalUsers.push(a_Ticket.userId);
      }
    }
    // console.log(`ASSIGNED TICKETS DATA: ${assignedTicketsData}`);
    // console.log(`ORIGINAL USERS: ${originalUsers}`);

    res.status(200).send({ assignedTicketsData, originalUsers });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

module.exports = {
  getUserData,
  getTicketFiles,
  addNewTicket,
  updateTicket,
  deleteTicket,
  userSearch,
  assignUser,
  unassignUser,
  getAssignedTickets,
};
