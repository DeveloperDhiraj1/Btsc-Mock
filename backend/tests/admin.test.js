const request = require('supertest');
const { app, server } = require('../server');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Test = require('../src/models/Test');
const Question = require('../src/models/Question');

// Mock User Model
jest.mock('../src/models/User', () => {
  const mockAdminUser = {
    _id: 'mock_admin_id_123',
    name: 'Admin User',
    email: 'admin@gmail.com',
    role: 'admin',
    isVerified: true
  };
  const mockStudentUser = {
    _id: 'mock_student_id_123',
    name: 'Student User',
    email: 'student@gmail.com',
    role: 'student',
    isVerified: true
  };

  return {
    findById: jest.fn().mockImplementation((id) => {
      const user = id === 'mock_admin_id_123' ? mockAdminUser : mockStudentUser;
      return {
        select: jest.fn().mockResolvedValue(user)
      };
    }),
    find: jest.fn().mockImplementation(() => {
      return {
        sort: jest.fn().mockResolvedValue([mockAdminUser, mockStudentUser])
      };
    }),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const user = id === 'mock_admin_id_123' ? mockAdminUser : mockStudentUser;
      return Promise.resolve({ ...user, ...update });
    }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'mock_student_id_123' }),
    countDocuments: jest.fn().mockResolvedValue(10)
  };
});

// Mock Test Model
jest.mock('../src/models/Test', () => {
  const mockTest = {
    _id: 'mock_test_id_123',
    title: 'Fluid Mechanics Mock Test',
    duration: 60,
    negativeMarking: 0.25,
    examCategory: 'BTSC',
    isActive: true,
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    findById: jest.fn().mockResolvedValue(mockTest),
    find: jest.fn().mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            sort: jest.fn().mockResolvedValue([mockTest])
          };
        })
      };
    }),
    countDocuments: jest.fn().mockResolvedValue(5)
  };
});

// Mock Question Model
jest.mock('../src/models/Question', () => {
  return {
    countDocuments: jest.fn().mockResolvedValue(50)
  };
});

// Mock JWT
jest.spyOn(jwt, 'verify').mockImplementation((token) => {
  if (token === 'admin-token') {
    return { id: 'mock_admin_id_123' };
  }
  return { id: 'mock_student_id_123' };
});

describe('Admin Panel API Endpoint Tests', () => {
  afterAll(async () => {
    // Terminate server bindings
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/tests/admin/stats', () => {
    it('should allow admin to fetch stats and return 200', async () => {
      const res = await request(app)
        .get('/api/tests/admin/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students).toBe(10);
      expect(res.body.data.questions).toBe(50);
      expect(res.body.data.tests).toBe(5);
    });

    it('should reject non-admin users with 403', async () => {
      const res = await request(app)
        .get('/api/tests/admin/stats')
        .set('Authorization', 'Bearer student-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/tests/:id/toggle', () => {
    it('should allow admin to toggle test status', async () => {
      const res = await request(app)
        .put('/api/tests/mock_test_id_123/toggle')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('toggled to');
    });
  });

  describe('GET /api/auth/users', () => {
    it('should allow admin to retrieve all registered users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PUT /api/auth/users/:id/role', () => {
    it('should allow admin to change a candidate role', async () => {
      const res = await request(app)
        .put('/api/auth/users/mock_student_id_123/role')
        .set('Authorization', 'Bearer admin-token')
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('role updated');
    });
  });

  describe('DELETE /api/auth/users/:id', () => {
    it('should allow admin to delete user accounts', async () => {
      const res = await request(app)
        .delete('/api/auth/users/mock_student_id_123')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });
  });
});
