// server/src/models/Category.js - Category model for posts

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    color: {
        type: String,
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color'],
        default: '#6366f1'
    },
    icon: {
        type: String, // Icon name or URL
        default: 'folder'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Virtual for post count (to be populated when needed)
categorySchema.virtual('postCount', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'category',
    count: true
});

module.exports = mongoose.model('Category', categorySchema);