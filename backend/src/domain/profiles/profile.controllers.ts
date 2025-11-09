import { type Request, type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { UserStore } from '@stores/user.store';
import { ProfileStore } from '@stores/profile.store';
import type { CookStatus, EmploymentStatus } from '../../types/database.types';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const userWithProfile = await ProfileStore.getUserWithProfile(req.user.id);

    if (!userWithProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Remove sensitive data
    const { password, two_factor_secret, ...safeUser } = userWithProfile.user;

    res.status(200).json({
      user: safeUser,
      cookProfile: userWithProfile.cookProfile,
      clientProfile: userWithProfile.clientProfile,
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile',
    });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const {
      // User fields
      first_name,
      last_name,
      phone,
      date_of_birth,
      address,
      city,
      postal_code,
      country,
      avatar_url,
      language,
      currency,
      notifications_enabled,
      email_notifications,
      sms_notifications,
      // Cook profile fields
      headline,
      bio,
      experience,
      video_intro_url,
      service_radius,
      hourly_rate,
      minimum_booking_hours,
      can_do_groceries,
      can_set_table,
      can_do_dishes,
      max_guests,
      employment_status,
      siret_number,
      insurance_number,
      insurance_expiry_date,
      id_card_url,
      insurance_cert_url,
      kbis_url,
      is_available,
      availability_note,
      // Client profile fields
      household_size,
      pet_friendly,
      smoking_allowed,
    } = req.body;

    // Get current user to check role
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Update user fields
    const userUpdates: Record<string, unknown> = {};
    if (first_name !== undefined) userUpdates.first_name = first_name;
    if (last_name !== undefined) userUpdates.last_name = last_name;
    if (phone !== undefined) userUpdates.phone = phone;
    if (date_of_birth !== undefined) userUpdates.date_of_birth = date_of_birth;
    if (address !== undefined) userUpdates.address = address;
    if (city !== undefined) userUpdates.city = city;
    if (postal_code !== undefined) userUpdates.postal_code = postal_code;
    if (country !== undefined) userUpdates.country = country;
    if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;
    if (language !== undefined) userUpdates.language = language;
    if (currency !== undefined) userUpdates.currency = currency;
    if (notifications_enabled !== undefined) userUpdates.notifications_enabled = notifications_enabled;
    if (email_notifications !== undefined) userUpdates.email_notifications = email_notifications;
    if (sms_notifications !== undefined) userUpdates.sms_notifications = sms_notifications;

    let updatedUser = user;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await UserStore.updateUser(req.user.id, userUpdates);
    }

    // Update profile based on role
    let updatedCookProfile;
    let updatedClientProfile;

    if (user.role === 'COOK') {
      const cookProfileUpdates: Record<string, unknown> = {};
      if (headline !== undefined) cookProfileUpdates.headline = headline;
      if (bio !== undefined) cookProfileUpdates.bio = bio;
      if (experience !== undefined) cookProfileUpdates.experience = experience;
      if (video_intro_url !== undefined) cookProfileUpdates.video_intro_url = video_intro_url;
      if (service_radius !== undefined) cookProfileUpdates.service_radius = service_radius;
      if (hourly_rate !== undefined) cookProfileUpdates.hourly_rate = hourly_rate;
      if (minimum_booking_hours !== undefined)
        cookProfileUpdates.minimum_booking_hours = minimum_booking_hours;
      if (can_do_groceries !== undefined) cookProfileUpdates.can_do_groceries = can_do_groceries;
      if (can_set_table !== undefined) cookProfileUpdates.can_set_table = can_set_table;
      if (can_do_dishes !== undefined) cookProfileUpdates.can_do_dishes = can_do_dishes;
      if (max_guests !== undefined) cookProfileUpdates.max_guests = max_guests;
      if (employment_status !== undefined)
        cookProfileUpdates.employment_status = employment_status as EmploymentStatus;
      if (siret_number !== undefined) cookProfileUpdates.siret_number = siret_number;
      if (insurance_number !== undefined) cookProfileUpdates.insurance_number = insurance_number;
      if (insurance_expiry_date !== undefined)
        cookProfileUpdates.insurance_expiry_date = insurance_expiry_date;
      if (id_card_url !== undefined) cookProfileUpdates.id_card_url = id_card_url;
      if (insurance_cert_url !== undefined) cookProfileUpdates.insurance_cert_url = insurance_cert_url;
      if (kbis_url !== undefined) cookProfileUpdates.kbis_url = kbis_url;
      if (is_available !== undefined) cookProfileUpdates.is_available = is_available;
      if (availability_note !== undefined) cookProfileUpdates.availability_note = availability_note;

      if (Object.keys(cookProfileUpdates).length > 0) {
        updatedCookProfile = await ProfileStore.updateCookProfile(req.user.id, cookProfileUpdates);
      } else {
        updatedCookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
      }
    } else if (user.role === 'CLIENT') {
      const clientProfileUpdates: Record<string, unknown> = {};
      if (household_size !== undefined) clientProfileUpdates.household_size = household_size;
      if (pet_friendly !== undefined) clientProfileUpdates.pet_friendly = pet_friendly;
      if (smoking_allowed !== undefined) clientProfileUpdates.smoking_allowed = smoking_allowed;

      if (Object.keys(clientProfileUpdates).length > 0) {
        updatedClientProfile = await ProfileStore.updateClientProfile(
          req.user.id,
          clientProfileUpdates
        );
      } else {
        updatedClientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
      }
    }

    // Remove sensitive data
    const { password, two_factor_secret, ...safeUser } = updatedUser;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: safeUser,
      cookProfile: updatedCookProfile,
      clientProfile: updatedClientProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required',
      });
      return;
    }

    const userWithProfile = await ProfileStore.getUserWithProfile(id);

    if (!userWithProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Remove sensitive data
    const { password, two_factor_secret, email, phone, ...safeUser } = userWithProfile.user;

    // For public profiles, only show limited cook profile data
    let publicCookProfile;
    if (userWithProfile.cookProfile) {
      const {
        siret_number,
        insurance_number,
        insurance_expiry_date,
        id_card_url,
        insurance_cert_url,
        kbis_url,
        total_earnings,
        ...publicCookData
      } = userWithProfile.cookProfile;
      publicCookProfile = publicCookData;
    }

    res.status(200).json({
      user: safeUser,
      cookProfile: publicCookProfile,
      clientProfile: userWithProfile.clientProfile
        ? {
            household_size: userWithProfile.clientProfile.household_size,
            pet_friendly: userWithProfile.clientProfile.pet_friendly,
            smoking_allowed: userWithProfile.clientProfile.smoking_allowed,
            total_bookings: userWithProfile.clientProfile.total_bookings,
            average_rating_given: userWithProfile.clientProfile.average_rating_given,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile',
    });
  }
};

export const getCookProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      city,
      min_rating,
      max_hourly_rate,
      limit,
      offset,
    } = req.query;

    const filters: {
      status?: CookStatus;
      city?: string;
      minRating?: number;
      maxHourlyRate?: number;
      limit?: number;
      offset?: number;
    } = {};

    if (status) {
      filters.status = status as CookStatus;
    }

    if (city) {
      filters.city = city as string;
    }

    if (min_rating) {
      filters.minRating = parseFloat(min_rating as string);
    }

    if (max_hourly_rate) {
      filters.maxHourlyRate = parseFloat(max_hourly_rate as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await ProfileStore.getCookProfiles(filters);

    // Remove sensitive data from cook profiles
    const publicProfiles = result.profiles.map((profile) => {
      const {
        siret_number,
        insurance_number,
        insurance_expiry_date,
        id_card_url,
        insurance_cert_url,
        kbis_url,
        total_earnings,
        ...publicData
      } = profile;
      return publicData;
    });

    res.status(200).json({
      profiles: publicProfiles,
      count: result.count,
      limit: filters.limit || 10,
      offset: filters.offset || 0,
    });
  } catch (error) {
    console.error('Get cook profiles error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cook profiles',
    });
  }
};

