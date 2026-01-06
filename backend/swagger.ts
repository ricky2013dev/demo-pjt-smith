import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smith PM BDM API',
      version: '1.0.0',
      description: 'API documentation for Smith Practice Management & Billing Data Management system',
      contact: {
        name: 'API Support',
        email: 'support@smithai.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.smithai.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            role: {
              type: 'string',
              enum: ['admin', 'dental', 'insurance'],
              description: 'User role'
            },
            dataSource: {
              type: 'string',
              nullable: true,
              description: 'Data source for the user'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Patient ID (format: P0000001)'
            },
            active: {
              type: 'boolean',
              description: 'Patient active status'
            },
            name: {
              type: 'object',
              properties: {
                given: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Given names'
                },
                family: {
                  type: 'string',
                  description: 'Family name'
                }
              }
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              nullable: true,
              description: 'Patient gender'
            },
            birthDate: {
              type: 'string',
              description: 'Birth date (masked: ****-**-**)'
            },
            birthDateEncrypted: {
              type: 'boolean',
              description: 'Whether birth date is encrypted'
            },
            ssn: {
              type: 'string',
              nullable: true,
              description: 'Social Security Number (masked: ***-**-****)'
            },
            ssnEncrypted: {
              type: 'boolean',
              description: 'Whether SSN is encrypted'
            },
            telecom: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'string',
                    enum: ['phone', 'email'],
                    description: 'Telecom system type'
                  },
                  value: {
                    type: 'string',
                    description: 'Telecom value (masked for sensitive data)'
                  },
                  encrypted: {
                    type: 'boolean',
                    description: 'Whether value is encrypted'
                  }
                }
              }
            },
            address: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  line: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    description: 'Address lines'
                  },
                  city: {
                    type: 'string',
                    nullable: true,
                    description: 'City'
                  },
                  state: {
                    type: 'string',
                    nullable: true,
                    description: 'State'
                  },
                  postalCode: {
                    type: 'string',
                    nullable: true,
                    description: 'Postal code'
                  }
                }
              }
            },
            insurance: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Insurance'
              }
            }
          }
        },
        Insurance: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Insurance ID'
            },
            type: {
              type: 'string',
              enum: ['Primary', 'Secondary'],
              description: 'Insurance type'
            },
            provider: {
              type: 'string',
              nullable: true,
              description: 'Insurance provider name'
            },
            policyNumber: {
              type: 'string',
              nullable: true,
              description: 'Policy number (masked: ************)'
            },
            policyNumberEncrypted: {
              type: 'boolean',
              description: 'Whether policy number is encrypted'
            },
            groupNumber: {
              type: 'string',
              nullable: true,
              description: 'Group number (masked: ********)'
            },
            groupNumberEncrypted: {
              type: 'boolean',
              description: 'Whether group number is encrypted'
            },
            subscriberName: {
              type: 'string',
              nullable: true,
              description: 'Subscriber name'
            },
            subscriberId: {
              type: 'string',
              nullable: true,
              description: 'Subscriber ID'
            },
            relationship: {
              type: 'string',
              nullable: true,
              description: 'Relationship to subscriber'
            },
            effectiveDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Effective date'
            },
            expirationDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Expiration date'
            },
            coverage: {
              type: 'object',
              properties: {
                deductible: {
                  type: 'string',
                  description: 'Deductible amount'
                },
                deductibleMet: {
                  type: 'string',
                  description: 'Deductible met amount'
                },
                maxBenefit: {
                  type: 'string',
                  description: 'Maximum benefit amount'
                },
                preventiveCoverage: {
                  type: 'string',
                  description: 'Preventive coverage percentage'
                },
                basicCoverage: {
                  type: 'string',
                  description: 'Basic coverage percentage'
                },
                majorCoverage: {
                  type: 'string',
                  description: 'Major coverage percentage'
                }
              }
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction ID'
            },
            requestId: {
              type: 'string',
              description: 'Request ID (format: REQ-YYYY-MM-DD-HH-MM-SS)'
            },
            patientId: {
              type: 'string',
              nullable: true,
              description: 'Associated patient ID'
            },
            status: {
              type: 'string',
              description: 'Transaction status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: ['./backend/routes.ts', './backend/index.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
