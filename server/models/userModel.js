const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "Please provide your first name"],
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, "Please provide your last name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: [true, "This email is already taken"],
    trim: true,
    lowercase: true, // casts uppercase to lowercase before saving in DB
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  phone_number: {
    type: String,
    trim: true,
    required: [true, "Please provide your phone number"],
    unique: [true, "This phone number is already taken"],
  },
  profile_picture: {
    type: String,
    default: "default.jpg",
  },
  address: {
    city: {
      type: String,
      required: function () {
        return this.role !== "user" && this.role !== "admin"; // Only required for non-regular users
      },
    },
    street: {
      type: String,
      required: function () {
        return this.role !== "user" && this.role !== "admin"; // Only required for non-regular users
      },
    },
    number: {
      type: Number,
      required: function () {
        return this.role !== "user" && this.role !== "admin"; // Only required for non-regular users
      },
    },
  },
  preferred_charger_type: {
    type: String,
    enum: ["Type 1", "Type 2", "CCS", "CHAdeMO", "Tesla", "Other", null],
  },
  // Building and parking spot relationships
  managed_buildings: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Building" }],
    validate: {
      validator: function (buildings) {
        // Required for building managers and must have at least one building
        return (
          this.role !== "building_manager" ||
          (buildings && buildings.length > 0)
        );
      },
      message: "Building managers must manage at least one building",
    },
  },
  resident_building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    validate: {
      validator: function (building) {
        // Required for building residents and must have a building
        return this.role !== "building_resident" || building;
      },
      message: "Building residents must be assigned to a building",
    },
  },
  owned_parking_spots: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "ParkingSpot" }],
    validate: {
      validator: function (spots) {
        // Required for private property owners and must have at least one spot
        return (
          this.role !== "private_prop_owner" ||
          this.role !== "building_resident" ||
          (spots && spots.length > 0)
        );
      },
      message: "Private property owners must own at least one parking spot",
    },
  },
  payment_methods: [
    {
      type: {
        type: String,
        enum: ["credit_card", "paypal", "apple_pay", "google_pay", "other"],
      },
      is_default: Boolean,
      last_four: String, // Last four digits of card
      provider_token: String, // Token from payment provider (encrypted)
    },
  ],
  role: {
    type: String,
    enum: [
      "admin",
      "building_manager",
      "user",
      "building_resident",
      "private_prop_owner",
    ],
    default: "user",
  },
  priority_score: {
    type: Number,
    default: 0,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false, // Don't return password in queries by default
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password "],
    validate: {
      // This validator only run on CREATE and SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match",
    },
  },
  notification_enabled: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  last_login: {
    type: Date,
  },
  is_active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Pre-save middleware to update updated_at timestamp
userSchema.pre("save", async function (next) {
  // If password wasn't modified, skip all this logic
  if (!this.isModified("password")) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;

  // Only update passwordChangedAt if the document is not new
  if (!this.isNew) {
    // Subtract 1 second to ensure token works properly
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
