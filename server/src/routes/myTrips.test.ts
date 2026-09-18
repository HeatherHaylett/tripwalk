import Fastify from 'fastify';
import { myTripsRoutes } from './myTrips';
import { beforeEach, describe, expect, test } from 'vitest'
import { db } from '../db/db';
import { trips, users } from '../db/schema';

const app = Fastify({ logger: false });

app.register(myTripsRoutes);

beforeEach(async () => {
    await db.delete(trips);
    await db.delete(users);
});

async function createUser(username: string) {
    const userId = crypto.randomUUID();
    await db.insert(users).values({ userId, username });
    return userId;
}

async function createTrip(userId: string) {
    const tripId = crypto.randomUUID();
    await db.insert(trips).values({
        tripId: tripId,
        ownerId: userId,
        tripName: "First Trip",
        destination: "Philadelphia, USA",
        isPublic: false,
        clientCreatedAt: new Date(),
    })
    return tripId;
}

describe('POST /myTrips', async () => {

    test("POST /myTrips creates a new trip for user A", async () => {
        const TEST_USER_ID_A = await createUser("Heather");
        const TRIP_ID_A = crypto.randomUUID();
        const response = await app.inject({
            method: 'POST',
            url: '/myTrips',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': TEST_USER_ID_A
            },
            body: {
                tripId: TRIP_ID_A,
                tripName: "First Trip",
                destination: "Philadelphia, USA",
                clientCreatedAt: "2026-09-17T19:40:00.000Z",
            }
        })

        expect(response.json()).toMatchObject({
            tripId: TRIP_ID_A,
            ownerId: TEST_USER_ID_A,
            tripName: "First Trip",
            destination: "Philadelphia, USA",
            isPublic: false,
            clientCreatedAt: "2026-09-17T19:40:00.000Z",
        })
    })

    test("POST /myTrips creates a new trip for user B", async () => {
        const TEST_USER_ID_B = await createUser("Chris");
        const TRIP_ID_B = crypto.randomUUID();
        const response = await app.inject({
            method: 'POST',
            url: '/myTrips',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': TEST_USER_ID_B
            },
            body: {
                tripId: TRIP_ID_B,
                tripName: "Second Trip",
                destination: "Philadelphia, USA",
                clientCreatedAt: "2026-09-17T19:40:00.000Z",
            }
        })

        expect(response.json()).toMatchObject({
            tripId: TRIP_ID_B,
            ownerId: TEST_USER_ID_B,
            tripName: "Second Trip",
            destination: "Philadelphia, USA",
            isPublic: false,
            clientCreatedAt: "2026-09-17T19:40:00.000Z",
        })
    })
})


describe('GET /myTrips', () => {
    test("GET /myTrips for user A returns 1 trip", async () => {
        const TEST_USER_ID_A = await createUser("Heather");
        const TRIP_ID_A = await createTrip(TEST_USER_ID_A);
        const TEST_USER_ID_B = await createUser("Heather");
        const TRIP_ID_B = await createTrip(TEST_USER_ID_B);
        const TRIP_ID_B2 = await createTrip(TEST_USER_ID_B);

        const response = await app.inject({
            method: 'GET',
            url: '/myTrips',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': TEST_USER_ID_A
            }
        })

        expect(response.json()).toEqual([{
            tripId: TRIP_ID_A,
            ownerId: TEST_USER_ID_A,
            tripName: "First Trip",
            destination: "Philadelphia, USA",
            isPublic: false,
            clientCreatedAt: expect.any(String),
            serverCreatedAt: expect.any(String),
        }])
    });

    test("GET /myTrips for user B returns 2 trips", async () => {
        const TEST_USER_ID_A = await createUser("Heather");
        const TRIP_ID_A = await createTrip(TEST_USER_ID_A);
        const TEST_USER_ID_B = await createUser("Heather");
        const TRIP_ID_B = await createTrip(TEST_USER_ID_B);
        const TRIP_ID_B2 = await createTrip(TEST_USER_ID_B);

        const response = await app.inject({
            method: 'GET',
            url: '/myTrips',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': TEST_USER_ID_B
            }
        })

        expect(response.json()).toEqual([{
            tripId: TRIP_ID_B,
            ownerId: TEST_USER_ID_B,
            tripName: "First Trip",
            destination: "Philadelphia, USA",
            isPublic: false,
            clientCreatedAt: expect.any(String),
            serverCreatedAt: expect.any(String),
        },
        {
            tripId: TRIP_ID_B2,
            ownerId: TEST_USER_ID_B,
            tripName: "First Trip",
            destination: "Philadelphia, USA",
            isPublic: false,
            clientCreatedAt: expect.any(String),
            serverCreatedAt: expect.any(String),
        }])
    });
})

describe("unauthenticated requests", () => {
    test("GET /myTrips returns 401 without an X-User-Id header", async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/myTrips',
        })

        expect(response.statusCode).toEqual(401);
    });

    test("POST /myTrips returns 401 without an X-User-Id header", async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/myTrips',
            body: {
                tripId: crypto.randomUUID(),
                tripName: "Second Trip",
                destination: "Philadelphia, USA",
                clientCreatedAt: "2026-09-17T19:40:00.000Z",
            }
        })

        expect(response.statusCode).toEqual(401);
    });
})



