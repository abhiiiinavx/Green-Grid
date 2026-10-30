import { Router } from 'express';
import * as applianceController from '../controllers/appliance.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createApplianceSchema, updateApplianceSchema, toggleApplianceSchema } from '../validators/appliance.validator.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', applianceController.getAppliances);
router.post('/scenes/activate', logAudit('SCENE_ACTIVATED', 'APPLIANCE'), applianceController.activatePresetScene);
router.post('/', validate(createApplianceSchema), logAudit('APPLIANCE_CREATED', 'APPLIANCE'), applianceController.createAppliance);
router.get('/:id', applianceController.getApplianceById);
router.put('/:id', validate(updateApplianceSchema), logAudit('APPLIANCE_UPDATED', 'APPLIANCE'), applianceController.updateAppliance);
router.post('/:id/toggle', validate(toggleApplianceSchema), logAudit('APPLIANCE_TOGGLED', 'APPLIANCE'), applianceController.toggleAppliance);
router.delete('/:id', logAudit('APPLIANCE_DELETED', 'APPLIANCE'), applianceController.deleteAppliance);

export default router;

