import { Router } from 'express';
import { getInventory, restockInventory } from '../controllers/inventory.controller';

const router = Router();

router.get('/medicine_inventory', getInventory);
router.patch('/medicine_inventory/:id/restock', restockInventory);

export default router;
