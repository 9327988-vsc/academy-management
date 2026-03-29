import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as settingsService from '../services/settings.service';

export async function getSettings(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function upsertSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { academyName, ownerName, phone, address, businessNumber } = req.body;
    const settings = await settingsService.upsertSettings({ academyName, ownerName, phone, address, businessNumber });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}
