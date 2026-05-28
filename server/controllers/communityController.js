const CommunityPost = require("../models/CommunityPost");
const Group = require("../models/Group");
const asyncHandler = require("../utils/asyncHandler");
const { cloudinary } = require("../config/cloudinary");

/**
 * ========================================
 * COMMUNITY CONTROLLER
 * ========================================
 *
 * Handles CRUD for public community posts.
 *
 * PRIVACY: When creating a post, we verify group membership
 * but only copy the group name as a plain string. The Group ID
 * is never stored in the CommunityPost document.
 *
 * Rate limit: Max 3 posts per user per day.
 */

// ── Helpers ────────────────────────────────

function getMemberId(member) {
  return member.user._id ? member.user._id.toString() : member.user.toString();
}

function isGroupMember(group, userId) {
  return group.members.some((m) => getMemberId(m) === userId.toString());
}

// -----------------------------------------
// @route   POST /api/community
// @desc    Create a new community post
// @access  Protected
// -----------------------------------------
const createPost = asyncHandler(async (req, res) => {
  const { groupId, destination, city, state, country, title, review, category, rating } = req.body;

  // Validate required fields
  if (!groupId || !destination || !city || !title || !review || !rating) {
    const error = new Error("Please provide all required fields: groupId, destination, city, title, review, rating");
    error.statusCode = 400;
    throw error;
  }

  // Rate limit — max 3 posts per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const postsToday = await CommunityPost.countDocuments({
    author: req.user._id,
    createdAt: { $gte: todayStart },
  });

  if (postsToday >= 3) {
    const error = new Error("You can only create up to 3 community posts per day");
    error.statusCode = 429;
    throw error;
  }

  // Verify user is a member of the specified group
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You are not a member of this group");
    error.statusCode = 403;
    throw error;
  }

  // Collect photo URLs from multer/Cloudinary upload
  const photos = req.files ? req.files.map((file) => file.path) : [];

  // Create the post — note: groupName is a plain string, NOT a reference
  const post = await CommunityPost.create({
    author: req.user._id,
    groupName: group.name, // Plain string snapshot — privacy by design
    destination: destination.trim(),
    location: {
      city: city.trim(),
      state: state ? state.trim() : "",
      country: country ? country.trim() : "India",
    },
    title: title.trim(),
    review: review.trim(),
    photos,
    category: category || "travel",
    rating: Number(rating),
  });

  await post.populate("author", "name username");

  res.status(201).json({ success: true, data: post });
});

// -----------------------------------------
// @route   GET /api/community
// @desc    Get paginated community feed
// @access  Protected
// @query   page, limit, sort (newest|helpful), search, category
// -----------------------------------------
const getAllPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "newest";
  const search = req.query.search || "";
  const category = req.query.category || "";

  // Build filter
  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category && category !== "all") {
    filter.category = category;
  }

  // Build sort
  let sortObj;
  if (sort === "helpful") {
    sortObj = { helpfulCount: -1, createdAt: -1 };
  } else {
    sortObj = { createdAt: -1 };
  }

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("author", "name username")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityPost.countDocuments(filter),
  ]);

  // Add user-specific flags (has the current user voted/wishlisted?)
  const userId = req.user._id.toString();
  const postsWithFlags = posts.map((post) => ({
    ...post,
    isHelpful: post.helpfulVotes?.some((id) => id.toString() === userId) || false,
    isWishlisted: post.wishlistedBy?.some((id) => id.toString() === userId) || false,
    // Remove the raw arrays from the response for efficiency
    helpfulVotes: undefined,
    wishlistedBy: undefined,
  }));

  res.json({
    success: true,
    data: postsWithFlags,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

// -----------------------------------------
// @route   GET /api/community/wishlist
// @desc    Get current user's wishlisted posts
// @access  Protected
// -----------------------------------------
const getMyWishlist = asyncHandler(async (req, res) => {
  const posts = await CommunityPost.find({ wishlistedBy: req.user._id })
    .populate("author", "name username")
    .sort({ createdAt: -1 })
    .lean();

  const userId = req.user._id.toString();
  const postsWithFlags = posts.map((post) => ({
    ...post,
    isHelpful: post.helpfulVotes?.some((id) => id.toString() === userId) || false,
    isWishlisted: true,
    helpfulVotes: undefined,
    wishlistedBy: undefined,
  }));

  res.json({ success: true, count: postsWithFlags.length, data: postsWithFlags });
});

// -----------------------------------------
// @route   GET /api/community/:id
// @desc    Get a single community post
// @access  Protected
// -----------------------------------------
const getPostById = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id)
    .populate("author", "name username")
    .lean();

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = req.user._id.toString();
  const postWithFlags = {
    ...post,
    isHelpful: post.helpfulVotes?.some((id) => id.toString() === userId) || false,
    isWishlisted: post.wishlistedBy?.some((id) => id.toString() === userId) || false,
    helpfulVotes: undefined,
    wishlistedBy: undefined,
  };

  res.json({ success: true, data: postWithFlags });
});

// -----------------------------------------
// @route   PUT /api/community/:id/helpful
// @desc    Toggle helpful vote on a post
// @access  Protected
// -----------------------------------------
const toggleHelpful = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = req.user._id;
  const alreadyVoted = post.helpfulVotes.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyVoted) {
    // Remove vote
    post.helpfulVotes = post.helpfulVotes.filter(
      (id) => id.toString() !== userId.toString()
    );
    post.helpfulCount = Math.max(0, post.helpfulCount - 1);
  } else {
    // Add vote
    post.helpfulVotes.push(userId);
    post.helpfulCount += 1;
  }

  await post.save();

  res.json({
    success: true,
    data: {
      isHelpful: !alreadyVoted,
      helpfulCount: post.helpfulCount,
    },
  });
});

// -----------------------------------------
// @route   PUT /api/community/:id/wishlist
// @desc    Toggle wishlist on a post
// @access  Protected
// -----------------------------------------
const toggleWishlist = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = req.user._id;
  const alreadyWishlisted = post.wishlistedBy.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyWishlisted) {
    post.wishlistedBy = post.wishlistedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
    post.wishlistCount = Math.max(0, post.wishlistCount - 1);
  } else {
    post.wishlistedBy.push(userId);
    post.wishlistCount += 1;
  }

  await post.save();

  res.json({
    success: true,
    data: {
      isWishlisted: !alreadyWishlisted,
      wishlistCount: post.wishlistCount,
    },
  });
});

// -----------------------------------------
// @route   DELETE /api/community/:id
// @desc    Delete own community post (author only)
// @access  Protected
// -----------------------------------------
const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  // Only the author can delete their own post
  if (post.author.toString() !== req.user._id.toString()) {
    const error = new Error("You can only delete your own posts");
    error.statusCode = 403;
    throw error;
  }

  // Delete photos from Cloudinary
  if (post.photos && post.photos.length > 0) {
    for (const photoUrl of post.photos) {
      try {
        // Extract public_id from Cloudinary URL
        const parts = photoUrl.split("/");
        const folderAndFile = parts.slice(parts.indexOf("splitease")).join("/");
        const publicId = folderAndFile.replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Failed to delete Cloudinary image:", err.message);
        // Continue even if image deletion fails
      }
    }
  }

  await CommunityPost.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "Community post deleted" });
});

module.exports = {
  createPost,
  getAllPosts,
  getMyWishlist,
  getPostById,
  toggleHelpful,
  toggleWishlist,
  deletePost,
};
