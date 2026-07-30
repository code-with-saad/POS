import { Category } from '../models/Category.js';

/** GET /api/categories — Authenticated users can list categories */
export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

/** POST /api/categories — Admin only */
export async function createCategory(req, res, next) {
  try {
    const { name, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/categories/:id — Admin only */
export async function updateCategory(req, res, next) {
  try {
    const { name, sortOrder } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) {
      const existing = await Category.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      category.name = name.trim();
    }

    if (sortOrder !== undefined) {
      category.sortOrder = Number(sortOrder);
    }

    await category.save();
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/categories/:id — Admin only */
export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
}
