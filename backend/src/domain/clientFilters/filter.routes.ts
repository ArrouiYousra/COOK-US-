import { Router } from 'express';
import { authGuard } from '@core/middleware';
import {
  getSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
} from './filter.controllers';

const router = Router();

router.get('/filters', authGuard, getSavedFilters);
router.post('/filters', authGuard, createSavedFilter);
router.patch('/filters/:filterId', authGuard, updateSavedFilter);
router.delete('/filters/:filterId', authGuard, deleteSavedFilter);

export default router;

