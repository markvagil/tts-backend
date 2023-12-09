const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const attachmentSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer,
});

const assignedUserSchema = new mongoose.Schema({
  userId: String,
  userName: String,
});

const ticketSchema = new mongoose.Schema({
  internal_id: mongoose.ObjectId, // internal id for the ticket
  title: String,
  description: String,
  uuid: Boolean,
  id: String,
  category: String,
  ticket_status: {
    status_title: String, // title of the status
    color: String, // color of this status
  },
  users: [assignedUserSchema], // all users that are assigned to this ticket, NOT including the creator
  attachments: [attachmentSchema], // array of attachmentSchema
});

const assignedTicketSchema = new mongoose.Schema({
  internal_id: mongoose.ObjectId, // internal id for the ticket
});

// user.userid.toString() to get the objectId as a string
const userSchema = new mongoose.Schema(
  {
    userId: String,
    userName: String,
    tickets: [ticketSchema],
    assignedTickets: [assignedTicketSchema],
  },
  {
    methods: {
      getUserData: async function () {
        return {
          userId: this.userId,
          userName: this.userName,
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
          // Merge the updated ticket data, including attachments
          //const existingAttachments = this.tickets[index].attachments || [];
          // const updatedAttachments = updatedTicket.attachments || [];
          // updatedTicket.attachments = [
          //   ...existingAttachments,
          //   ...updatedAttachments,
          // ];

          updatedTicket.attachments = this.tickets[index].attachments;

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
      assignTicket: async function (ticket) {
        console.log("assigning ticket", ticket);
        this.assignedTickets.push(ticket);
        return this.save();
      },
      getAssignedTickets: async function () {
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
      unassignTicket: async function (ticketId) {
        const newObjectId = new ObjectId(ticketId);
        const index = this.assignedTickets.findIndex((ticket) =>
          ticket.internal_id.equals(newObjectId)
        );

        if (index !== -1) {
          this.assignedTickets.splice(index, 1);
          return this.save();
        } else {
          throw new Error("Ticket not found"); // Handle the case where the ticket with the given ID was not found
        }
      },
      deleteAttachments: async function (ticketId) {
        const newObjectId = new ObjectId(ticketId);

        const ticketIndex = this.tickets.findIndex((ticket) =>
          ticket.internal_id.equals(newObjectId)
        );

        if (ticketIndex !== -1) {
          const attachments = this.tickets[ticketIndex].attachments;

          // Assuming you have a GridFSBucket instance in your database connection
          const bucket = new mongoose.mongo.GridFSBucket(this.db.db, {
            bucketName: "attachments",
          });

          // Delete each attachment from GridFS
          const deletionPromises = attachments.map(async (attachment) => {
            return new Promise((resolve, reject) => {
              // Check if attachment has data (Binary) and delete it
              if (attachment.data) {
                bucket.delete(attachment.data, (error) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve();
                  }
                });
              }
            });
          });

          await Promise.all(deletionPromises);

          // Clear the attachments array
          this.tickets[ticketIndex].attachments = [];
        } else {
          // Handle the case where the ticket with the given ID was not found
          throw new Error("Ticket not found");
        }

        return this.save();
      },
    },
  }
);

userSchema.statics.findUsersByUsernamePartial = async function (
  partialUsername
) {
  // Perform a case-insensitive search for users with usernames starting with the given partialUsername
  const users = await this.find(
    { userName: { $regex: new RegExp(`^${partialUsername}`, "i") } },
    "userId userName"
  );

  return users;
};

const User = mongoose.model("User", userSchema, "Users");

module.exports = User;
