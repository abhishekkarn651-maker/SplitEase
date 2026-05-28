const mongoose = require("mongoose");

/**
 * CommunityPost Schema
 * --------------------
 * Represents a public trip review / location spotlight posted
 * to the global community feed.
 *
 * PRIVACY: This collection is completely separate from the
 * private Group collection. The groupName is stored as a plain
 * string snapshot — no Group ObjectId is referenced, so private
 * group data (members, expenses) can never be leaked.
 *
 * Fields:
 *  - author:       Reference to the User who created the post
 *  - groupName:    Plain string copy of the group name at publish time
 *  - destination:  Name of the place reviewed (e.g., "Mayapur Temple")
 *  - location:     Structured location info (city, state, country)
 *  - title:        Post title
 *  - review:       Full review text
 *  - photos:       Array of Cloudinary image URLs
 *  - category:     Post category for filtering
 *  - rating:       1–5 star rating
 *  - helpfulVotes: Array of User IDs who upvoted
 *  - wishlistedBy: Array of User IDs who wishlisted
 *  - helpfulCount: Denormalized count for efficient sorting
 *  - wishlistCount: Denormalized count
 *
 * Timestamps adds createdAt and updatedAt automatically.
 */
const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    groupName: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [200, "Destination cannot exceed 200 characters"],
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        maxlength: [100, "City cannot exceed 100 characters"],
      },
      state: {
        type: String,
        trim: true,
        maxlength: [100, "State cannot exceed 100 characters"],
        default: "",
      },
      country: {
        type: String,
        trim: true,
        maxlength: [100, "Country cannot exceed 100 characters"],
        default: "India",
      },
    },
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    review: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
      maxlength: [5000, "Review cannot exceed 5000 characters"],
    },
    photos: {
      type: [String],
      validate: {
        validator: (val) => val.length <= 5,
        message: "Maximum 5 photos allowed",
      },
      default: [],
    },
    category: {
      type: String,
      enum: ["travel", "food", "adventure", "culture", "nature", "other"],
      default: "travel",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    wishlistedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
      index: true,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient feed queries (sort by newest or most helpful)
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ helpfulCount: -1, createdAt: -1 });

// Text index for search functionality
communityPostSchema.index({ title: "text", destination: "text", review: "text" });

module.exports = mongoose.model("CommunityPost", communityPostSchema);
