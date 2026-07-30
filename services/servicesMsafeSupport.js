const SupportTicket = require("../models/modelsMsafeSupport");

// 🔹 Generate Unique Ticket ID
async function generateTicketId() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4); // last 4 digits

  return `MSafe-${random}${timestamp}`;
}

// 🔹 Create Support Ticket
async function createTicket(data) {
  const { userId, name, email, category, message } = data;

  const ticketId = await generateTicketId();

  const ticket = new SupportTicket({
    userId,
    name,
    email,
    category,
    message,
    ticketId
  });

  await ticket.save();

  return ticket;
}

// 🔹 Get All Tickets (for admin later)
async function getAllTickets() {
  return await SupportTicket.find().sort({ createdAt: -1 });
}

module.exports = {
  createTicket,
  getAllTickets
};
