import { Table } from '../models/Table.js';

/** GET /api/tables — Authenticated users can list tables */
export async function getTables(req, res, next) {
  try {
    const { section, status } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (status) filter.status = status;

    const tables = await Table.find(filter).sort({ section: 1, name: 1 });
    res.json({ success: true, data: tables });
  } catch (err) {
    next(err);
  }
}

/** POST /api/tables — Admin only */
export async function createTable(req, res, next) {
  try {
    const { name, section, capacity, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Table name is required' });
    }

    const existing = await Table.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Table name already exists' });
    }

    const table = await Table.create({
      name: name.trim(),
      section: section ? section.trim() : 'Main Hall',
      capacity: capacity ? Number(capacity) : 4,
      status: status || 'available',
    });

    res.status(201).json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/tables/:id — Admin only */
export async function updateTable(req, res, next) {
  try {
    const { name, section, capacity, status } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (name) {
      const existing = await Table.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Table name already exists' });
      }
      table.name = name.trim();
    }

    if (section !== undefined) table.section = section.trim();
    if (capacity !== undefined) table.capacity = Number(capacity);
    if (status) table.status = status;

    await table.save();
    res.json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/tables/:id/status — Toggle or set status */
export async function updateTableStatus(req, res, next) {
  try {
    const { status } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = status || (table.status === 'available' ? 'occupied' : 'available');
    await table.save();

    res.json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tables/:id — Admin only */
export async function deleteTable(req, res, next) {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
}
