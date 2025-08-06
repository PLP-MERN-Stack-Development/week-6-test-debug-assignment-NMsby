// server/src/models/Post.js - Post model with relationships

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        minlength: [10, 'Content must be at least 10 characters long']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    excerpt: {
        type: String,
        maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },
    featuredImage: {
        type: String, // URL to image
        default: null
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    publishedAt: {
        type: Date
    },
    readTime: {
        type: Number, // Reading time in minutes
        default: 1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' }); // Text search

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Pre-save middleware
postSchema.pre('save', function(next) {
    // Generate slug if not provided or title changed
    if (!this.slug || this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Generate excerpt if not provided
    if (!this.excerpt && this.content) {
        this.excerpt = this.content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .substring(0, 150) + '...';
    }

    // Calculate reading time (average 200 words per minute)
    if (this.content) {
        const wordCount = this.content.split(/\s+/).length;
        this.readTime = Math.ceil(wordCount / 200);
    }

    // Set published date when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

// Static methods
postSchema.statics.getPublishedPosts = function(options = {}) {
    const { page = 1, limit = 10, category, author, tags } = options;
    const skip = (page - 1) * limit;

    const query = { status: 'published' };

    if (category) query.category = category;
    if (author) query.author = author;
    if (tags && tags.length) query.tags = { $in: tags };

    return this.find(query)
        .populate('author', 'username fullName avatar')
        .populate('category', 'name slug color')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);
};

postSchema.statics.searchPosts = function(searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return this.find({
        $text: { $search: searchTerm },
        status: 'published'
    })
        .populate('author', 'username fullName avatar')
        .populate('category', 'name slug color')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);
};

// Instance methods
postSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

postSchema.methods.toggleLike = function(userId) {
    const userIdString = userId.toString();
    const likeIndex = this.likes.findIndex(like => like.toString() === userIdString);

    if (likeIndex > -1) {
        this.likes.splice(likeIndex, 1); // Unlike
    } else {
        this.likes.push(userId); // Like
    }

    return this.save();
};

module.exports = mongoose.model('Post', postSchema);