const ticketData = require("../controllers/ticket_data.js");
const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage(); // Use memory storage for handling files in memory
const upload = multer({ storage: storage });

const router = express.Router();

// get, post (put/create), patch (update), delete

// USER routes
router.post("/get_user_data", ticketData.getUserData); // POST get user data from userid
router.post("/get_ticket_files", ticketData.getTicketFiles); // POST get ticket files from userid and ticket id")
router.post("/user_search", ticketData.userSearch); // POST search for users
router.post("/assign_user", ticketData.assignUser); // POST assign user to ticket
router.post("/unassign_user", ticketData.unassignUser); // POST unassign user from ticket

// TICKET routes
router.post("/new_ticket", upload.array("files", 10), ticketData.addNewTicket); // post new ticket
router.patch("/update_ticket", ticketData.updateTicket);
// router.patch(
//   "/update_ticket",
//   upload.array("files", 10),
//   ticketData.updateTicket
// ); // update ticket data for this specific ticket
router.delete("/delete_ticket", ticketData.deleteTicket); // delete this specific ticket
router.post("/get_assigned_tickets", ticketData.getAssignedTickets); // POST get all assigned tickets for this user

module.exports = router;
