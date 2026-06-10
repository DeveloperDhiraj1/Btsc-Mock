const request = require('supertest');
const { app, server } = require('../server');
const User = require('../src/models/User');

let mockUserExists = false;
let mockUserVerified = false;

// Mock User Model static queries
jest.mock('../src/models/User', () => {
  const mockUser = {
    _id: 'mock_user_id_123',
    name: 'Dhiraj Kumar',
    email: 'dhiraj@gmail.com',
    role: 'student',
    get isVerified() { return mockUserVerified; },
    set isVerified(val) { mockUserVerified = val; },
    verificationOTP: '123456',
    otpExpiry: new Date(Date.now() + 500000),
    matchPassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    findOne: jest.fn().mockImplementation((query) => {
      const chainable = {
        select: jest.fn().mockImplementation((selectString) => {
          if (query.email === 'dhiraj@gmail.com' && mockUserExists) {
            return Promise.resolve(mockUser);
          }
          return Promise.resolve(null);
        }),
        then: function(resolve, reject) {
          if (query.email === 'duplicate@gmail.com') {
            return Promise.resolve(mockUser).then(resolve, reject);
          }
          if (query.email === 'dhiraj@gmail.com' && mockUserExists) {
            return Promise.resolve(mockUser).then(resolve, reject);
          }
          return Promise.resolve(null).then(resolve, reject);
        }
      };
      return chainable;
    }),
    create: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser)
  };
});

describe('Authentication API Endpoint Tests', () => {
  afterAll(async () => {
    // Terminate server bindings
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student and return 201', async () => {
      mockUserExists = false;
      mockUserVerified = false;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dhiraj Kumar',
          email: 'dhiraj@gmail.com',
          password: 'Secure@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent to your email');
    });

    it('should prevent registration of existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dhiraj',
          email: 'duplicate@gmail.com',
          password: 'Secure@123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should successfully verify student email with correct OTP', async () => {
      mockUserExists = true;
      mockUserVerified = false;
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'dhiraj@gmail.com',
          otp: '123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verified successfully');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should sign in verified student and issue JWT token', async () => {
      mockUserExists = true;
      mockUserVerified = true;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dhiraj@gmail.com',
          password: 'Secure@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('dhiraj@gmail.com');
    });
  });
});
