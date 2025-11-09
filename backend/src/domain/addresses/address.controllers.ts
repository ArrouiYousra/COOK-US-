import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { AddressStore } from '@stores/address.store';
import { ProfileStore } from '@stores/profile.store';
import { UserStore } from '@stores/user.store';
import { MapboxService } from '@core/services/mapbox.service';
import { BookingStore } from '@stores/booking.store';

export const getMyAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only clients can see their addresses
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients can view their addresses',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    // Client sees all their addresses
    const addresses = await AddressStore.getAddressesByClient(clientProfile.id, true);

    res.status(200).json({
      addresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get addresses',
    });
  }
};

export const getClientAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { clientId } = req.params;
    if (!clientId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Client ID is required',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileById(clientId);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    // Other users (cooks, etc.) only see default address
    const addresses = await AddressStore.getAddressesByClient(clientProfile.id, false);

    res.status(200).json({
      addresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error('Get client addresses error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get client addresses',
    });
  }
};

export const getAddressById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Address ID is required',
      });
      return;
    }

    const address = await AddressStore.getAddressById(addressId);
    if (!address) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Address not found',
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Check permissions: client can see their own, others can only see if it's default
    if (user.role === 'CLIENT') {
      const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
      if (!clientProfile || clientProfile.id !== address.client_profile_id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own addresses',
        });
        return;
      }
    } else {
      // Other users can only see default addresses
      if (!address.is_default) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view default addresses',
        });
        return;
      }
    }

    res.status(200).json({
      address,
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get address',
    });
  }
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only clients and admins can create addresses
    const user = await UserStore.getUserById(req.user.id);
    if (!user || (user.role !== 'CLIENT' && user.role !== 'ADMIN')) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and admins can create addresses',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const {
      type,
      label,
      street,
      street_number,
      complement,
      city,
      postal_code,
      country,
      latitude,
      longitude,
      access_code,
      access_notes,
      parking_info,
      has_oven,
      has_dishwasher,
      kitchen_notes,
      is_default,
    } = req.body;

    // Validate required fields
    if (!street || !street_number || !city || !postal_code) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'street, street_number, city, and postal_code are required',
      });
      return;
    }

    // If coordinates are not provided, try to geocode the address using Mapbox
    let finalLatitude = latitude;
    let finalLongitude = longitude;

    if (!finalLatitude || !finalLongitude) {
      try {
        // Build address string for geocoding
        const addressString = `${street_number || ''} ${street}, ${postal_code} ${city}, ${country || 'FR'}`.trim();
        const geocodeResult = await MapboxService.geocodeAddress(addressString, country || 'FR');
        
        if (geocodeResult) {
          finalLatitude = geocodeResult.latitude;
          finalLongitude = geocodeResult.longitude;
          console.log(`Address geocoded successfully: ${geocodeResult.placeName}`);
        } else {
          console.warn(`Could not geocode address: ${addressString}`);
        }
      } catch (geocodeError) {
        // Log error but continue - address can be created without coordinates
        console.warn('Mapbox geocoding failed, continuing without coordinates:', geocodeError);
      }
    }

    // If still no coordinates after geocoding attempt, return error
    if (!finalLatitude || !finalLongitude) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'latitude and longitude are required. If not provided, address geocoding will be attempted automatically.',
      });
      return;
    }

    const address = await AddressStore.createAddress(clientProfile.id, {
      type,
      label,
      street,
      street_number,
      complement,
      city,
      postal_code,
      country,
      latitude: finalLatitude,
      longitude: finalLongitude,
      access_code,
      access_notes,
      parking_info,
      has_oven,
      has_dishwasher,
      kitchen_notes,
      is_default,
    });

    res.status(201).json({
      message: 'Address created successfully',
      address,
    });
  } catch (error) {
    console.error('Create address error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create address';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Address ID is required',
      });
      return;
    }

    // Only clients and admins can update addresses
    const user = await UserStore.getUserById(req.user.id);
    if (!user || (user.role !== 'CLIENT' && user.role !== 'ADMIN')) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and admins can update addresses',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const {
      type,
      label,
      street,
      street_number,
      complement,
      city,
      postal_code,
      country,
      latitude,
      longitude,
      access_code,
      access_notes,
      parking_info,
      has_oven,
      has_dishwasher,
      kitchen_notes,
      is_default,
    } = req.body;

    const address = await AddressStore.updateAddress(addressId, clientProfile.id, {
      type,
      label,
      street,
      street_number,
      complement,
      city,
      postal_code,
      country,
      latitude,
      longitude,
      access_code,
      access_notes,
      parking_info,
      has_oven,
      has_dishwasher,
      kitchen_notes,
      is_default,
    });

    res.status(200).json({
      message: 'Address updated successfully',
      address,
    });
  } catch (error) {
    console.error('Update address error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only update')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Address ID is required',
      });
      return;
    }

    // Only clients and admins can delete addresses
    const user = await UserStore.getUserById(req.user.id);
    if (!user || (user.role !== 'CLIENT' && user.role !== 'ADMIN')) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and admins can delete addresses',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    await AddressStore.deleteAddress(addressId, clientProfile.id);

    res.status(200).json({
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only delete')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Address ID is required',
      });
      return;
    }

    // Only clients and admins can set default address
    const user = await UserStore.getUserById(req.user.id);
    if (!user || (user.role !== 'CLIENT' && user.role !== 'ADMIN')) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and admins can set default address',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const address = await AddressStore.setDefaultAddress(addressId, clientProfile.id);

    res.status(200).json({
      message: 'Default address set successfully',
      address,
    });
  } catch (error) {
    console.error('Set default address error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to set default address';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only set')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const getBookingAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { bookingId } = req.params;
    if (!bookingId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    // Verify booking exists and user is participant
    const booking = await BookingStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
      return;
    }

    // Check if booking has address_id
    if (!booking.address_id) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking does not have an address',
      });
      return;
    }

    const address = await AddressStore.getAddressById(booking.address_id);
    if (!address) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Address not found',
      });
      return;
    }

    // Verify user is participant (client or cook)
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Client can always see their booking address
    // Cook can see booking address if they are the assigned cook
    if (user.role === 'CLIENT') {
      const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
      if (!clientProfile || clientProfile.id !== booking.client_profile_id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not the client of this booking',
        });
        return;
      }
    } else if (user.role === 'COOK') {
      if (!booking.cook_profile_id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'No cook assigned to this booking',
        });
        return;
      }

      const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
      if (!cookProfile || cookProfile.id !== booking.cook_profile_id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not the cook of this booking',
        });
        return;
      }
    } else {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can view booking addresses',
      });
      return;
    }

    res.status(200).json({
      address,
    });
  } catch (error) {
    console.error('Get booking address error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking address',
    });
  }
};

