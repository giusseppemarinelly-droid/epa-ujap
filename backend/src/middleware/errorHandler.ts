import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Datos inválidos', details: err.flatten() });
  }

  // Sin esto, un id que no existe (ej. invitar a un userId inventado a un
  // chat grupal) rompe la restricción de llave foránea de Prisma y cae en
  // el 500 genérico de abajo en vez de un 400/404 claro.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Uno de los datos enviados no existe' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'No encontrado' });
    }
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
