//FLOYNEX PAY\backend\models\User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },


  // Unique seller code (VERY IMPORTANT)
servedBy: {
  type: String
},

  email: {
    type: String,
    unique: true,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  businessName: {
    type: String,
    required: true
  },

  // Location
  country: {
    type: String,
    default: "Kenya"
  },
  county: {
    type: String,
    required: true
  },
  town: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },

 // Ensure these are inside your UserSchema fields in models/User.js
deletionToken: {
  type: String,
  default: null
},
deletionTokenExpiry: {
  type: Date,
  default: null
},
profilePhoto: {
  type: String,
  default: "default-avatar.png",
},
  password: {
    type: String,
    required: true
  },
resetToken: {
  type: String,
  default: null
},

resetTokenExpiry: {
  type: Date,
  default: null
},
// Add this new field
currentSessionId: {
  type: String,
  default: null
}
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
