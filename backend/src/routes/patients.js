import express from 'express';
import { patientController } from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // Proteger todas las rutas

router.get('/', patientController.getAll);
router.get('/:id', patientController.getById);
router.post('/', patientController.create);
router.put('/:id', patientController.update);
router.delete('/:id', patientController.delete);

export default router;
