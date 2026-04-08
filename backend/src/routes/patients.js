import Router from 'koa-router';
import patientController from '../controllers/patientController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = new Router({ prefix: '/patients' });

router.use(authenticateToken);

router.get('/', requirePermission('users', 'view'), patientController.getAllPatients);
router.get('/:id', requirePermission('users', 'view'), patientController.getPatientById);
router.post('/', requirePermission('users', 'create'), patientController.createPatient);
router.put('/:id', requirePermission('users', 'edit'), patientController.updatePatient);
router.delete('/:id', requirePermission('users', 'delete'), patientController.deletePatient);

export default router;
