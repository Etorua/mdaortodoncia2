import Router from 'koa-router';
import patientController from '../controllers/patientController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = new Router({ prefix: '/patients' });

router.use(authenticateToken);

router.get('/', requirePermission('patients', 'view'), patientController.getAllPatients);
router.get('/:id', requirePermission('patients', 'view'), patientController.getPatientById);
router.post('/', requirePermission('patients', 'create'), patientController.createPatient);
router.put('/:id', requirePermission('patients', 'edit'), patientController.updatePatient);
router.delete('/:id', requirePermission('patients', 'delete'), patientController.deletePatient);

export default router;
