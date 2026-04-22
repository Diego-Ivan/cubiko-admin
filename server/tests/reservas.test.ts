import { reprogramarReservaConTransaccion } from '../src/services/reservaService';
import pool from '../src/config/database';
import { expect, describe, it, jest } from '@jest/globals';

jest.mock('../src/config/database', () => {
    return {
        __esModule: true,
        default: {
            getConnection: jest.fn<any>()
        }
    };
});

describe('Reservas Service - reprogramarReservaConTransaccion', () => {
    it('should throw error if room does not exist', async () => {
        const mockQuery = jest.fn<any>();
        mockQuery
            .mockResolvedValueOnce([[{ id: 1, estudiante_id: 2, status: 'Activa' }]]) // obtenerReservaConId
            .mockResolvedValueOnce([[]]); // check salas

        const mockConnection = {
            query: mockQuery,
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
        };

        (pool.getConnection as jest.Mock<any>).mockResolvedValue(mockConnection);

        await expect(reprogramarReservaConTransaccion(
            1, // reservaId
            2, // estudianteId
            {
                salaUbicacion: 'Biblioteca',
                salaNumero: 101,
                fechaInicio: '2026-04-22',
                horaInicio: '10:00',
                fechaFin: '2026-04-22',
                horaFin: '12:00'
            }
        )).rejects.toThrow('La sala 101 en Biblioteca no existe');

        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw error if conflict exists', async () => {
        const mockQuery = jest.fn<any>();
        mockQuery
            .mockResolvedValueOnce([[{ id: 1, estudiante_id: 2, status: 'Activa' }]]) // obtenerReservaConId
            .mockResolvedValueOnce([[{ id: 1 }]]) // check salas
            .mockResolvedValueOnce([[{ id: 5 }]]); // conflicts

        const mockConnection = {
            query: mockQuery,
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
        };

        (pool.getConnection as jest.Mock<any>).mockResolvedValue(mockConnection);

        await expect(reprogramarReservaConTransaccion(
            1, // reservaId
            2, // estudianteId
            {
                salaUbicacion: 'Biblioteca',
                salaNumero: 101,
                fechaInicio: '2026-04-22',
                horaInicio: '10:00',
                fechaFin: '2026-04-22',
                horaFin: '12:00'
            }
        )).rejects.toThrow('La sala ya está reservada en el rango seleccionado');

        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should pass if room exists and no conflicts', async () => {
        const mockQuery = jest.fn<any>();
        mockQuery
            .mockResolvedValueOnce([[{ id: 1, estudiante_id: 2, status: 'Activa' }]]) // obtenerReservaConId
            .mockResolvedValueOnce([[{ id: 1 }]]) // check salas
            .mockResolvedValueOnce([[]]) // conflicts
            .mockResolvedValueOnce([{ insertId: 1 }]); // update

        const mockConnection = {
            query: mockQuery,
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
        };

        (pool.getConnection as jest.Mock<any>).mockResolvedValue(mockConnection);

        await expect(reprogramarReservaConTransaccion(
            1, // reservaId
            2, // estudianteId
            {
                salaUbicacion: 'Biblioteca',
                salaNumero: 101,
                fechaInicio: '2026-04-22',
                horaInicio: '10:00',
                fechaFin: '2026-04-22',
                horaFin: '12:00'
            }
        )).resolves.not.toThrow();

        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });
});
