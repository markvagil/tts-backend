// const express = require('express');
// const router = express.Router();
const User = require("../schemas/schema.js");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// GET
// User login authentication, if successful it returns the userId
// DEPRECATED
// const userLogin = async (req, res) => {
//   const { userEmail, userPassword } = req.body;
//   if (!userEmail || !userPassword) {
//     res.status(400).send({ error: "All fields are required." });
//     return;
//   }
//   try {
//     // Find the user with this email
//     console.log(`Searching for user with email: ${userEmail}`);
//     const user = await User.findOne({ userEmail });
//     // If user is not found then return 404 error
//     if (!user) {
//       res
//         .status(404)
//         .send({ error: `User not found with email ${userEmail}.` });
//       return;
//     }
//     // If user is found then validate the password
//     console.log(`Found a user with email ${userEmail}, validating password`);
//     // If the passwords do not match then return 401 error
//     if (user.userPassword !== userPassword) {
//       res.status(401).send({ error: "Incorrect password." });
//       return;
//     }
//     // If the passwords match then return the user id
//     console.log(`User ${userEmail} authenticated`);
//     res.status(200).send({ userId: user.userId });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

// GET
// Fetch user data using userId, if user does not exist then create a new user
const getUserData = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).send({ error: "userId field is missing." });
    return;
  }
  try {
    console.log(`Searching for user with userId: ${userId}`);
    let user = await User.findOne({ userId });
    // check if the user exists
    if (!user) {
      const newUser = new User({
        userId: userId,
        tickets: [],
        assignedTickets: [],
      });
      console.log(`UserId not found, adding new user with userId: ${userId}`);
      user = new User(newUser);
      await user.save();
      console.log(`New user added: ${JSON.stringify(user, null, 2)}`);
    } else {
      console.log(`Found a user with userId: ${userId}`);
    }

    console.log(
      "Query result:",
      user ? JSON.stringify(user, null, 2) : "No user found"
    );

    // if (!user) {
    //   res.status(404).send({ error: "User not found." });
    //   return;
    // }
    res.status(200).send({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

// POST
// User account creation
// DEPRECATED
// const addNewUser = async (req, res) => {
//   console.log(req.body);
//   const { userEmail, userPassword } = req.body;

//   if (!userEmail || !userPassword) {
//     res.status(400).send({ error: "Error: missing email and password." });
//     return;
//   }

//   const newUser = new User({
//     userId: new mongoose.Types.ObjectId(),
//     tickets: [],
//     assignedTickets: [],
//   });

//   try {
//     console.log(`Checking if this email aleady exists: ${newUser.userEmail}`);
//     const duplicate_user = await User.findOne({ userEmail });
//     if (!duplicate_user) {
//       console.log(`Adding new user with userId: ${newUser.userId}`);
//       const user = new User(newUser);
//       await user.save();
//       console.log(`New user added: ${JSON.stringify(user, null, 2)}`);
//       res
//         .status(200)
//         .send({ success: `User ${user.userEmail} added successfully.` });
//     } else {
//       res.status(400).send({ error: "Error: user already exists." });
//       return;
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: `An error occurred while processing your request: ${err.message}`,
//     });
//     return;
//   }
// };

// POST
// Add a new ticket for this userId to their tickets list
const addNewTicket = async (req, res) => {
  const { userId, ticket } = req.body;
  if (!userId || !ticket) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }
  const ticket_title = ticket.title; // check if this ticket at least has a title
  if (!ticket_title) {
    res.status(400).send({ error: "Ticket title is required." });
    return;
  }
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).send({ error: "User not found." });
      return;
    }

    const newTicket = {
      internal_id: new mongoose.Types.ObjectId(),
      title: ticket.title,
      description: ticket.description,
      id: ticket.id,
      category: ticket.category,
      status: {
        status_title: ticket.status.status_title,
        color: ticket.status.color,
      },
      users: ticket.users,
      attachments: ticket.attachments,
    };

    console.log(`Adding new ticket for user with userId: ${user.userId}`);
    user.addNewTicket(newTicket);
    console.log(`New ticket added: ${JSON.stringify(ticket, null, 2)}`);
    res.status(200).send({ success: "Ticket added successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
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
    const user = await User.findOne({ userId }); // Fetch the user data with this ID
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
      id: updatedTicket.id,
      category: updatedTicket.category,
      status: {
        status_title: updatedTicket.status.status_title,
        color: updatedTicket.status.color,
      },
      users: updatedTicket.users,
      attachments: updatedTicket.attachments,
    };
    //TODO fix internal id not getting saved with this
    user.updateTicket(ticketId, updatedTicket_for_DB);
    console.log(`Ticket updated: ${JSON.stringify(updatedTicket, null, 2)}`);
    res.status(200).send({ success: "Ticket updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: `An error occurred while processing your request: ${err.message}`,
    });
    return;
  }
};

// DELETE
// Delete a ticket for this userId and ticketId
const deleteTicket = async (req, res) => {
  const { userId, ticketId } = req.body;
  if (!userId || !ticketId) {
    res.status(400).send({ error: "All fields are required." });
    return;
  }
  try {
    const user = await User.findOne({ userId }); // Fetch the user data with this ID
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
    console.log(`Deleting ticket for user with userId: ${user.userId}`);
    user.deleteTicket(ticketId);
    console.log(`Ticket deleted with internal_id of: ${ticketId}`);
    res.status(200).send({ success: "Ticket deleted successfully." });
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
  addNewUser,
  addNewTicket,
  userLogin,
  updateTicket,
  deleteTicket,
};
