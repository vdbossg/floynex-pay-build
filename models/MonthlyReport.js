const mongoose = require("mongoose");

const MonthlyReportSchema = new mongoose.Schema(
{
    month: Number,

    year: Number,

    revenue: {
        type: Number,
        default: 0
    },

    expenses: {
        type: Number,
        default: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    carryForward: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["open", "closed"],
        default: "closed"
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("MonthlyReport", MonthlyReportSchema);