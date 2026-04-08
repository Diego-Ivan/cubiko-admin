import { Request, Response } from 'express';
import { getAllRooms, getAvailableRooms, getUsedRooms } from '../services/roomService';
import { validateRequest, roomAvailabilitySchema } from '../utils/validators';
import { RoomAvailabilityQuery } from '../types';

// ==================
// Get All Rooms
// ==================
export async function listAllRooms(_req: Request, res: Response): Promise<void> {
  try {
    const rooms = await getAllRooms();

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// ==================
// Get Available Rooms
// ==================
export async function listAvailableRooms(req: Request, res: Response): Promise<void> {
  try {
    const query = await validateRequest<RoomAvailabilityQuery>(
      roomAvailabilitySchema,
      req.query
    );

    const rooms = await getAvailableRooms(
      query.fecha,
      query.horaInicio,
      query.horaFin,
      query.capacidad
    );

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

// ==================
// Get Used Rooms
// ==================
export async function listUsedRooms(_req: Request, res: Response): Promise<void> {
  try {
    const rooms = await getUsedRooms();

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
