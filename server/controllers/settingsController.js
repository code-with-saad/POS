import { Settings } from '../models/Settings.js';

/** GET /api/settings — Public/authenticated read for POS & receipts */
export async function getSettings(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/settings — Admin only update */
export async function updateSettings(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}
