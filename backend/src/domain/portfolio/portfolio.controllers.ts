import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { PortfolioStore } from '@stores/portfolio.store';
import { ProfileStore } from '@stores/profile.store';
import { UserStore } from '@stores/user.store';
import type { CreatePortfolioItemDTO, UpdatePortfolioItemDTO } from '../../types/database.types';

// ============ PORTFOLIO ============

export const getMyPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can manage portfolio
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can manage portfolio',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const portfolioItems = await PortfolioStore.getPortfolioItemsByCookProfileId(cookProfile.id);

    res.status(200).json({
      portfolio: portfolioItems,
      count: portfolioItems.length,
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get portfolio',
    });
  }
};

export const getCookPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cookId } = req.params;
    if (!cookId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cook profile ID is required',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileById(cookId);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const portfolioItems = await PortfolioStore.getPortfolioItemsByCookProfileId(cookProfile.id);

    res.status(200).json({
      portfolio: portfolioItems,
      count: portfolioItems.length,
    });
  } catch (error) {
    console.error('Get cook portfolio error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cook portfolio',
    });
  }
};

export const createPortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can create portfolio items
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can create portfolio items',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const itemData: CreatePortfolioItemDTO = req.body;

    // Validation
    if (!itemData.title || !itemData.media_url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Title and media_url are required',
      });
      return;
    }

    const portfolioItem = await PortfolioStore.createPortfolioItem(cookProfile.id, itemData);

    res.status(201).json({
      message: 'Portfolio item created successfully',
      item: portfolioItem,
    });
  } catch (error) {
    console.error('Create portfolio item error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create portfolio item',
      details: errorMessage,
    });
  }
};

export const updatePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can update portfolio items
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can update portfolio items',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { itemId } = req.params;
    if (!itemId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Portfolio item ID is required',
      });
      return;
    }

    const updates: UpdatePortfolioItemDTO = req.body;

    const portfolioItem = await PortfolioStore.updatePortfolioItem(
      itemId,
      cookProfile.id,
      updates
    );

    res.status(200).json({
      message: 'Portfolio item updated successfully',
      item: portfolioItem,
    });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update portfolio item',
      details: errorMessage,
    });
  }
};

export const deletePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can delete portfolio items
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can delete portfolio items',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { itemId } = req.params;
    if (!itemId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Portfolio item ID is required',
      });
      return;
    }

    await PortfolioStore.deletePortfolioItem(itemId, cookProfile.id);

    res.status(200).json({
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete portfolio item',
      details: errorMessage,
    });
  }
};

// Reorder removed - no display_order in SQL schema

