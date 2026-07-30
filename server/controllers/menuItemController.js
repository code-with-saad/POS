import { MenuItem } from '../models/MenuItem.js';

/** GET /api/menu-items — Authenticated users can list menu items */
export async function getMenuItems(req, res, next) {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const items = await MenuItem.find(filter)
      .populate('category', 'name sortOrder')
      .sort({ name: 1 });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

/** POST /api/menu-items — Admin only */
export async function createMenuItem(req, res, next) {
  try {
    const { name, description, price, category, isAvailable, imageUrl } = req.body;
    if (!name || price === undefined || !category) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, price, and category are required' });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price),
      category,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      imageUrl: imageUrl || '',
    });

    const populated = await item.populate('category', 'name sortOrder');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/menu-items/:id — Admin only */
export async function updateMenuItem(req, res, next) {
  try {
    const { name, description, price, category, isAvailable, imageUrl } = req.body;
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (name) item.name = name.trim();
    if (description !== undefined) item.description = description.trim();
    if (price !== undefined) item.price = Number(price);
    if (category) item.category = category;
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (imageUrl !== undefined) item.imageUrl = imageUrl;

    await item.save();
    const populated = await item.populate('category', 'name sortOrder');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/menu-items/:id/availability — Admin only toggle */
export async function toggleAvailability(req, res, next) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();
    const populated = await item.populate('category', 'name sortOrder');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/menu-items/:id — Admin only */
export async function deleteMenuItem(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    next(err);
  }
}
