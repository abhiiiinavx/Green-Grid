import { Router } from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGoalSchema, updateGoalSchema, updateBudgetSchema } from '../validators/goal.validator.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

router.get('/', goalController.getGoalsAndBudgets);
router.post('/', validate(createGoalSchema), logAudit('GOAL_CREATED'), goalController.createGoal);
router.put('/budget', validate(updateBudgetSchema), logAudit('BUDGET_UPDATED'), goalController.updateBudget);
router.put('/:id', validate(updateGoalSchema), logAudit('GOAL_UPDATED'), goalController.updateGoal);
router.delete('/:id', logAudit('GOAL_DELETED'), goalController.deleteGoal);

export default router;

