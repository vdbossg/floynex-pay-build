//M-Safe\backend\controllers\controllersMsafeSupport.js
const { createTicket, getAllTickets } = require("../services/servicesMsafeSupport");
//const Support = require("../models/modelsMSafeSupport");
const Support = require("../models/modelsMsafeSupport");
const { sendSupportReplyEmail } = require("../serviceEmail");
// ================= CREATE SUPPORT TICKET =================
exports.createSupport = async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    // Basic validation
    if (!name || !email || !category || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Optional: get userId if logged in
    const userId = req.user?.id || null;

    const ticket = await createTicket({
      userId,
      name,
      email,
      category,
      message
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created",
      ticketId: ticket.ticketId
    });

  } catch (err) {
    console.error("Create support error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET ALL SUPPORT TICKETS =================
exports.getSupport = async (req, res) => {
  try {
    const tickets = await getAllTickets();

    res.status(200).json({
      success: true,
      data: tickets
    });

  } catch (err) {
    console.error("Get support error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ================= REPLY TO TICKET =================
exports.replySupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ error: "Reply is required" });
    }

    const ticket = await Support.findById(id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // ✅ SEND EMAIL
    await sendSupportReplyEmail(
      ticket.email,
      ticket.name,
      ticket.ticketId,
      ticket.message,
      reply
    );

    // ✅ UPDATE STATUS AFTER EMAIL SUCCESS
    ticket.status = "replied";
    ticket.reply = reply;
    ticket.repliedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: "Reply sent successfully"
    });

  } catch (err) {
    console.error("Reply support error:", err);
    res.status(500).json({ error: "Failed to send reply" });
  }
};
