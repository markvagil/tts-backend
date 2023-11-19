const express = require("express");
const ticketData = require("../controllers/ticket_data.js");

const router = express.Router();

// get, post (put/create), patch (update), delete

// USER routes
router.get("/get_user_data", ticketData.getUserData); // get user data from id
// router.post("/new_user", ticketData.addNewUser); // post new user
// router.get("/user_login", ticketData.userLogin); // get user login -> check if their email and password are correct, returns user id

// TICKET routes
router.post("/new_ticket", ticketData.addNewTicket); // post new ticket
// these 2 might not be needed
// router.get("/get_all_tickets", ticketData.getAllTickets); // get all tickets for this user
// router.get("/get_ticket_data", ticketData.getTicketData); // get ticket for this specific ticket
router.patch("/update_ticket", ticketData.updateTicket); // update ticket data for this specific ticket
router.delete("/delete_ticket", ticketData.deleteTicket); // delete this specific ticket

module.exports = router;
