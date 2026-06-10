const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BTSC Competitive Exam Mock Platform API',
    version: '1.0.0',
    description: 'Enterprise-grade MERN Mock test SaaS platform backend documentation.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token. Get it from /auth/login.'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Dhiraj Kumar' },
          email: { type: 'string', example: 'dhiraj@gmail.com' },
          role: { type: 'string', enum: ['student', 'admin'], example: 'student' }
        }
      },
      Question: {
        type: 'object',
        properties: {
          subject: { type: 'string', example: 'Civil Engineering' },
          topic: { type: 'string', example: 'Fluid Mechanics' },
          question: { type: 'string', example: 'What is the SI unit of dynamic viscosity?' },
          options: {
            type: 'array',
            items: { type: 'string' },
            example: ['Pascal-second', 'Poise', 'Stoke', 'Newton-second']
          },
          correctAnswer: { type: 'integer', example: 0 },
          explanation: { type: 'string', example: 'SI unit is Pascal-second (Pa.s), also equivalent to N.s/m².' },
          difficulty: { type: 'string', example: 'easy' },
          examType: { type: 'string', example: 'BTSC JE' }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string', minimum: 6 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful. OTP sent.' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login student/admin',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Access token returned.' }
        }
      }
    },
    '/questions': {
      get: {
        summary: 'Fetch questions list',
        tags: ['Questions'],
        parameters: [
          { name: 'subject', in: 'query', schema: { type: 'string' } },
          { name: 'examType', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Paginated questions list.' }
        }
      }
    },
    '/tests': {
      get: {
        summary: 'Get test templates list',
        tags: ['Tests'],
        responses: {
          200: { description: 'Active tests returned.' }
        }
      }
    },
    '/tests/submit': {
      post: {
        summary: 'Submit student attempt',
        tags: ['Tests'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  testId: { type: 'string' },
                  answers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        questionId: { type: 'string' },
                        selectedOption: { type: 'integer' },
                        timeSpent: { type: 'integer' }
                      }
                    }
                  },
                  timeSpent: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Scorecard and AI report generated.' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
