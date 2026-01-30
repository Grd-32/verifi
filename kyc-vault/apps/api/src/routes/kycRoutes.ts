import { Router } from 'express';
import { KycController } from '../controllers/kycController';

const router = Router();
const kycController = new KycController();

router.post('/upload', kycController.uploadDocument);
router.get('/documents', kycController.getDocuments);
router.post('/authenticate', kycController.authenticateUser);
router.get('/partners', kycController.getPartners);

export default router;