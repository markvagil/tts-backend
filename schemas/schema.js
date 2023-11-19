const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const attachmentSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer,
});

const ticketSchema = new mongoose.Schema({
  internal_id: mongoose.ObjectId, // internal id for the ticket
  title: String,
  description: String,
  id: String,
  category: String,
  status: {
    status_title: String, // title of the status
    color: String, // color of this status
  },
  users: [String], // all users that are assigned to this ticket, NOT including the creator
  attachments: [attachmentSchema], // array of attachmentSchema
});

// user.userid.toString() to get the objectId as a string
const userSchema = new mongoose.Schema(
  {
    userId: String,
    tickets: [ticketSchema],
    assignedTickets: [ticketSchema],
  },
  {
    methods: {
      getUserData: async function () {
        return {
          userId: this.userId,
          tickets: this.tickets,
          assignedTickets: this.assignedTickets,
        };
      },
      addNewTicket: async function (ticket) {
        this.tickets.push(ticket);
        return this.save();
      },
      getAllTickets: async function () {
        return this.tickets;
      },
      getTicketData: async function (ticketId) {
        return this.tickets.find((ticket) => ticket.id === ticketId);
      },
      updateTicket: async function (ticketId, updatedTicket) {
        const newObjectId = new ObjectId(ticketId);

        const index = this.tickets.findIndex((ticket) =>
          ticket.internal_id.equals(newObjectId)
        );

        if (index !== -1) {
          this.tickets[index] = updatedTicket;
          return this.save();
        } else {
          throw new Error("Ticket not found"); // Handle the case where the ticket with the given ID was not found
        }
      },
      deleteTicket: async function (ticketId) {
        const newObjectId = new ObjectId(ticketId);

        const index = this.tickets.findIndex((ticket) =>
          ticket.internal_id.equals(newObjectId)
        );

        if (index !== -1) {
          this.tickets.splice(index, 1);
          return this.save();
        } else {
          throw new Error("Ticket not found"); // Handle the case where the ticket with the given ID was not found
        }
      },
      addAssignedTicket: async function (ticket) {
        this.assignedTickets.push(ticket);
        return this.save();
      },
      getAllAssignedTickets: async function () {
        return this.assignedTickets;
      },
      getAssignedTicketData: async function (ticketId) {
        return this.assignedTickets.find((ticket) => ticket.id === ticketId);
      },
      updateAssignedTicket: async function (ticketId, updatedTicket) {
        const index = this.assignedTickets.findIndex(
          (ticket) => ticket.id === ticketId
        );
        this.assignedTickets[index] = updatedTicket;
        return this.save();
      },
      deleteAssignedTicket: async function (ticketId) {
        const index = this.assignedTickets.findIndex(
          (ticket) => ticket.id === ticketId
        );
        this.assignedTickets.splice(index, 1);
      },
    },
  }
);

const User = mongoose.model("User", userSchema, "Users");

module.exports = User;
