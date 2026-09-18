import { FastifyRequest, FastifyReply } from 'fastify';

export async function authStub(request: FastifyRequest, reply: FastifyReply) {
  // 1. read the x-user-id header
  const userId = request.headers['x-user-id'];
  // 2. if it's missing, reply.code(401).send(...) and return
  // 3. otherwise, stash it somewhere on `request` for route handlers to read later
  if (typeof userId === 'string' && userId.length > 0) {
     request.userId = userId;
  } else {
    reply.code(401).send('Missing user id');
    return
  }
 
}