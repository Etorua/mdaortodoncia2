import Router from 'koa-router';
import clinicalModuleController from '../controllers/clinicalModuleController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = new Router({ prefix: '/clinical-modules' });

const requireClinicalModulePermission = (action) => async (ctx, next) => {
	const moduleKey = (ctx.params.moduleKey || '').toString().trim().toLowerCase();
	return requirePermission(moduleKey, action)(ctx, next);
};

router.use(authenticateToken);

router.get('/:moduleKey/references', requireClinicalModulePermission('view'), clinicalModuleController.getReferences.bind(clinicalModuleController));
router.get('/:moduleKey', requireClinicalModulePermission('view'), clinicalModuleController.getAll.bind(clinicalModuleController));
router.get('/:moduleKey/:id', requireClinicalModulePermission('view'), clinicalModuleController.getById.bind(clinicalModuleController));
router.post('/:moduleKey', requireClinicalModulePermission('create'), clinicalModuleController.create.bind(clinicalModuleController));
router.put('/:moduleKey/:id', requireClinicalModulePermission('edit'), clinicalModuleController.update.bind(clinicalModuleController));
router.delete('/:moduleKey/:id', requireClinicalModulePermission('delete'), clinicalModuleController.delete.bind(clinicalModuleController));

export default router;