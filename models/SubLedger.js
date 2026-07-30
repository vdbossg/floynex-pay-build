const mongoose = require("mongoose");

const SubLedgerSchema = new mongoose.Schema(
{
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    source: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    reference: {
        type: String,
        default: null
    },

    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null
    },

    month: Number,
    year: Number
},
{
    timestamps: true
}
);

module.exports = mongoose.model("SubLedger", SubLedgerSchema);
