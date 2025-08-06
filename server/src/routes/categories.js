// server/src/routes/categories.js - Category routes

const express = require('express');
const Category = require('../models/Category');
const { authenticate, authorize } = require('../middleware/auth');
const {
    validateCategory,
    validateObjectId,
    handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', validateObjectId(), async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { category }
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), validateCategory, async (req, res, next) => {
    try {
        const { name, description, color, icon } = req.body;

        const category = await Category.create({
            name,
            description,
            color,
            icon
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), validateObjectId(), validateCategory, async (req, res, next) => {
    try {
        const { name, description, color, icon, isActive } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, color, icon, isActive },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), validateObjectId(), async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;