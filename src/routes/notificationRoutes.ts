import {Router} from 'express';
import validateNotificationPayload from '../middlewares/validateNotificationPayload';


import rateLimiter from '..//middlewares/notificationRateLImiter';
const notificationRoutes: Router = Router();

notificationRoutes.post('/'  ,rateLimiter,validateNotificationPayload, (req, res) => {
  res.send('Notification Service');
});

export default notificationRoutes;