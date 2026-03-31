import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as announcementService from '../services/announcement.service';

export async function listAnnouncements(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const announcements = await announcementService.listAnnouncements();
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, content, important } = req.body;
    const announcement = await announcementService.createAnnouncement({
      title,
      content,
      important: important || false,
      authorId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const { title, content, important } = req.body;
    const announcement = await announcementService.updateAnnouncement(id, { title, content, important });
    res.json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await announcementService.deleteAnnouncement(id);
    res.json({ success: true, message: '공지가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
}
