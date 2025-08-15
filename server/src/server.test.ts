import request from 'supertest';
import { app } from './index';

describe('Server Health Check', () => {
  describe('GET /health', () => {
    it('should return 200 OK with status message', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('rooms');
      expect(response.body).toHaveProperty('connections');
    });
  });

  describe('GET /api/rooms', () => {
    it('should return rooms list', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);
    });
  });
});