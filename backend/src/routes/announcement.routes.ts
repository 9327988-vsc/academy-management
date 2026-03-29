import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../middleware/validate.middleware';
import * as announcementController from '../controllers/announcement.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('principal'));

router.get('/', announcementController.listAnnouncements);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('제목을 입력해주세요.'),
    body('content').notEmpty().withMessage('내용을 입력해주세요.'),
  ],
  validate,
  announcementController.createAnnouncement,
);

router.patch('/:id', announcementController.updateAnnouncement);

router.delete('/:id', announcementController.deleteAnnouncement);

export default router;
