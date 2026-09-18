import { FastifyInstance } from 'fastify';
import { authStub } from '../plugins/authStub';
import { db } from '../db/db';
import { trips } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function myTripsRoutes(app: FastifyInstance) {
    app.get('/myTrips', { preHandler: authStub }, async (request, reply) => {
        if (!request.userId) {
            return reply.code(401).send('Unauthorized');
        }
        const data = await db.select().from(trips).where(eq(trips.ownerId, request.userId))
        return data;
    });

    interface CreateTripBody {
        tripId: string;
        tripName: string;
        destination: string;
        clientCreatedAt: string;
        isPublic?: boolean;
    }

    app.post<{ Body: CreateTripBody }>('/myTrips', {
        preHandler: authStub,
        schema: {
            body: {
                type: 'object',
                required: ['tripId', 'tripName', 'destination', 'clientCreatedAt'],
                properties: {
                    tripId: { type: "string" },
                    tripName: { type: "string" },
                    destination: { type: "string" },
                    clientCreatedAt: { type: "string" },
                    isPublic: { type: 'boolean' },
                },
                additionalProperties: false,
            },
        },
    }, async (request, reply) => {
        if (!request.userId) {
            return reply.code(401).send('Unauthorized');
        }
        const { tripId, tripName, destination, clientCreatedAt, isPublic } = request.body;
        const userId = request.userId
        const dateObject = new Date(clientCreatedAt);
        const data = await db.insert(trips).values({tripId, ownerId: userId, tripName, destination, isPublic, clientCreatedAt: dateObject}).returning();
        return data[0];
    });
}