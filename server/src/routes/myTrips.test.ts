import Fastify from 'fastify';
import { myTripsRoutes } from './myTrips';
import { beforeAll, expect, test } from 'vitest'
import { db } from '../db/db';
import { users } from '../db/schema';

const app = Fastify({ logger: true });

app.register(myTripsRoutes);

const TEST_USER_ID_A = crypto.randomUUID();
const TEST_USER_ID_B = crypto.randomUUID();

const TRIP_ID_A = crypto.randomUUID();
const TRIP_ID_B = crypto.randomUUID();


beforeAll(async () => {
    const dataA = await db.insert(users).values({userId: TEST_USER_ID_A, username: 'Heather'});
    const dataB = await db.insert(users).values({userId: TEST_USER_ID_B, username: 'Chris'});

    return;
})

test("create a new trip A", async () => {
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

test("create a new trip B", async () => {
    const response = await app.inject({
        method: 'POST',
        url: '/myTrips',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': TEST_USER_ID_B 
        },
        body: {
            tripId: TRIP_ID_B,
            tripName: "First Trip",
            destination: "Philadelphia, USA",
            clientCreatedAt: "2026-09-17T19:40:00.000Z",
        }
    })

    expect(response.json()).toMatchObject({
        tripId: TRIP_ID_B,
        ownerId: TEST_USER_ID_B,
        tripName: "First Trip",
        destination: "Philadelphia, USA",
        isPublic: false,
        clientCreatedAt: "2026-09-17T19:40:00.000Z",
    })
})

test("get trips for user A", async () => {
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
        clientCreatedAt: "2026-09-17T19:40:00.000Z",
        serverCreatedAt: expect.any(String),
    }])
})

test("get trips for user B", async () => {
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
        clientCreatedAt: "2026-09-17T19:40:00.000Z",
        serverCreatedAt: expect.any(String),
    }])
})
