import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { CertificationStore } from '@stores/certification.store';
import { ProfileStore } from '@stores/profile.store';
import { UserStore } from '@stores/user.store';
import type { CreateCertificationDTO, UpdateCertificationDTO } from '../../types/database.types';

// ============ CERTIFICATIONS ============

export const getMyCertifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can manage certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can manage certifications',
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

    const certifications = await CertificationStore.getCertificationsByCookProfileId(
      cookProfile.id
    );

    res.status(200).json({
      certifications,
      count: certifications.length,
    });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get certifications',
    });
  }
};

export const getCookCertifications = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const certifications = await CertificationStore.getCertificationsByCookProfileId(
      cookProfile.id
    );

    // Only show verified certifications publicly
    const publicCertifications = certifications.filter(
      (cert) => cert.verification_status === 'VERIFIED'
    );

    res.status(200).json({
      certifications: publicCertifications,
      count: publicCertifications.length,
    });
  } catch (error) {
    console.error('Get cook certifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cook certifications',
    });
  }
};

export const createCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can create certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can create certifications',
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

    const certData: CreateCertificationDTO = req.body;

    // Validation
    if (!certData.name || !certData.issuing_organization) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and issuing_organization are required',
      });
      return;
    }

    const certification = await CertificationStore.createCertification(cookProfile.id, certData);

    res.status(201).json({
      message: 'Certification created successfully',
      certification,
    });
  } catch (error) {
    console.error('Create certification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create certification',
      details: errorMessage,
    });
  }
};

export const updateCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can update certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can update certifications',
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

    const { certId } = req.params;
    if (!certId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Certification ID is required',
      });
      return;
    }

    const updates: UpdateCertificationDTO = req.body;

    const certification = await CertificationStore.updateCertification(
      certId,
      cookProfile.id,
      updates
    );

    res.status(200).json({
      message: 'Certification updated successfully',
      certification,
    });
  } catch (error) {
    console.error('Update certification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update certification',
      details: errorMessage,
    });
  }
};

export const deleteCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can delete certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can delete certifications',
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

    const { certId } = req.params;
    if (!certId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Certification ID is required',
      });
      return;
    }

    await CertificationStore.deleteCertification(certId, cookProfile.id);

    res.status(200).json({
      message: 'Certification deleted successfully',
    });
  } catch (error) {
    console.error('Delete certification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete certification',
      details: errorMessage,
    });
  }
};

// Admin only endpoints
export const verifyCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only admins can verify certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can verify certifications',
      });
      return;
    }

    const { certId } = req.params;
    if (!certId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Certification ID is required',
      });
      return;
    }

    const { status, notes } = req.body;
    if (!status || (status !== 'VERIFIED' && status !== 'REJECTED')) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Status must be VERIFIED or REJECTED',
      });
      return;
    }

    const certification = await CertificationStore.verifyCertification(
      certId,
      req.user.id,
      status,
      notes
    );

    res.status(200).json({
      message: `Certification ${status.toLowerCase()} successfully`,
      certification,
    });
  } catch (error) {
    console.error('Verify certification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify certification',
      details: errorMessage,
    });
  }
};

export const getPendingCertifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only admins can view pending certifications
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can view pending certifications',
      });
      return;
    }

    const certifications = await CertificationStore.getCertificationsByStatus('PENDING');

    res.status(200).json({
      certifications,
      count: certifications.length,
    });
  } catch (error) {
    console.error('Get pending certifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get pending certifications',
    });
  }
};

