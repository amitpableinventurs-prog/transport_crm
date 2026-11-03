module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Transport ERP Customer API',
    version: '1.0.0',
    description: 'Login ID + password authentication, customer profile/KYC, customer management, activity history and booking eligibility APIs.'
  },
  servers: [{ url: '/', description: 'Current API host' }],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Customer Portal' },
    { name: 'Customer Management' },
    { name: 'Bookings' },
    { name: 'Driver Management' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Request could not be completed.' }
        }
      },
      LoginRequest: {
        type: 'object', required: ['loginId', 'password'],
        properties: { loginId: { type: 'string', example: 'admin' }, password: { type: 'string', format: 'password' } }
      },
      CustomerRegistration: {
        type: 'object', required: ['contactPerson', 'phone', 'password'],
        properties: {
          contactPerson: { type: 'string', example: 'Ravi Kumar' },
          companyName: { type: 'string', example: 'Kumar Traders' },
          phone: { type: 'string', pattern: '^[6-9]\d{9}$', example: '9876543210', description: 'Also becomes the login ID.' },
          password: { type: 'string', minLength: 8, format: 'password' }
        }
      },
      AccountUpsert: {
        type: 'object', required: ['loginId'],
        properties: {
          loginId: { type: 'string', example: 'ravi.driver' },
          password: { type: 'string', minLength: 8, format: 'password', description: 'Required when creating the login; send to reset it.' },
          status: { type: 'string', enum: ['Active', 'Disabled'] }
        }
      },
      CustomerStatusUpdate: {
        type: 'object', required: ['status'],
        properties: {
          status: { type: 'string', enum: ['Pending', 'Active', 'Suspended'] },
          remarks: { type: 'string', maxLength: 250 }
        }
      },
      CustomerRegistration: {
        type: 'object',
        required: [
          'customerType', 'company', 'contactPerson', 'phone', 'billingAddress',
          'billingCity', 'billingState', 'billingPincode', 'paymentTerms',
          'creditLimit', 'status', 'verificationStatus'
        ],
        properties: {
          customerType: { type: 'string', enum: ['Company', 'Individual'] },
          company: { type: 'string', minLength: 2, maxLength: 200 },
          contactPerson: { type: 'string', minLength: 2, maxLength: 120 },
          phone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          alternatePhone: { type: 'string', pattern: '^[6-9]\\d{9}$' },
          email: { type: 'string', format: 'email' },
          gstin: { type: 'string', pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' },
          pan: { type: 'string', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$' },
          industry: { type: 'string', maxLength: 120 },
          billingAddress: { type: 'string', minLength: 3, maxLength: 500 },
          billingCity: { type: 'string', minLength: 2, maxLength: 100 },
          billingState: { type: 'string', minLength: 2, maxLength: 100 },
          billingPincode: { type: 'string', pattern: '^\\d{6}$' },
          pickupAddress: { type: 'string', maxLength: 500 },
          pickupCity: { type: 'string', maxLength: 100 },
          pickupState: { type: 'string', maxLength: 100 },
          pickupPincode: { type: 'string', pattern: '^\\d{6}$' },
          paymentTerms: { type: 'string', enum: ['Advance', 'COD', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days'] },
          creditLimit: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Blocked'] },
          verificationStatus: { type: 'string', enum: ['Pending', 'Verified', 'Rejected'] },
          notes: { type: 'string', maxLength: 2000 }
        },
        additionalProperties: false
      },
      KycReview: {
        type: 'object', required: ['status'],
        properties: {
          status: { type: 'string', enum: ['Verified', 'Rejected'] },
          remarks: { type: 'string', maxLength: 500, description: 'Required when rejecting.' }
        }
      },
      KycDocumentUpload: {
        type: 'object', required: ['documentType', 'file'],
        properties: {
          documentType: { type: 'string', enum: ['pan', 'gstin', 'address_proof'] },
          file: { type: 'string', format: 'binary', description: 'PDF, JPEG or PNG; maximum 5 MB.' }
        }
      },
      CustomerActivity: {
        type: 'object', required: ['type', 'subject'],
        properties: {
          type: { type: 'string', enum: ['note', 'call', 'email', 'sms', 'follow_up'] },
          subject: { type: 'string', minLength: 1, maxLength: 120 },
          description: { type: 'string', maxLength: 2000 },
          followUpAt: { type: 'string', format: 'date-time', description: 'Required when type is follow_up.' }
        }
      },
      CompleteProfile: {
        type: 'object', required: ['companyName', 'contactPerson', 'email', 'pan', 'address'],
        properties: {
          companyName: { type: 'string' },
          contactPerson: { type: 'string' },
          email: { type: 'string', format: 'email' },
          gstin: { type: 'string' },
          pan: { type: 'string', example: 'ABCDE1234F' },
          address: {
            type: 'object', required: ['street', 'city', 'state', 'pincode'],
            properties: { street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, pincode: { type: 'string', example: '411001' } }
          }
        }
      },
      BookingRequest: {
        type: 'object', required: ['pickupAddress', 'deliveryAddress', 'cargo', 'vehicleRequirement', 'schedule'],
        properties: {
          pickupAddress: { $ref: '#/components/schemas/BookingAddress' },
          deliveryAddress: { $ref: '#/components/schemas/BookingAddress' },
          cargo: { $ref: '#/components/schemas/BookingCargo' },
          vehicleRequirement: { $ref: '#/components/schemas/VehicleRequirement' },
          schedule: { $ref: '#/components/schemas/BookingSchedule' }
        }
      },
      BookingAddress: {
        type: 'object', required: ['contactName', 'contactPhone', 'street', 'city', 'state', 'pincode'],
        properties: {
          contactName: { type: 'string' }, contactPhone: { type: 'string' }, street: { type: 'string' },
          city: { type: 'string' }, state: { type: 'string' }, pincode: { type: 'string' }, landmark: { type: 'string' }
        }
      },
      BookingCargo: {
        type: 'object', required: ['goodsType', 'packageType', 'quantity', 'weightKg'],
        properties: {
          goodsType: { type: 'string' }, packageType: { type: 'string', enum: ['carton', 'box', 'bag', 'pallet', 'drum', 'container', 'loose', 'other'] },
          quantity: { type: 'integer', minimum: 1 }, weightKg: { type: 'number', minimum: 0.01 }, description: { type: 'string' },
          volumeCbm: { type: 'number', minimum: 0 }, isFragile: { type: 'boolean' }, isHazardous: { type: 'boolean' }
        }
      },
      VehicleRequirement: {
        type: 'object', required: ['vehicleType'],
        properties: { vehicleType: { type: 'string' }, minCapacityKg: { type: 'number', minimum: 0 }, specialRequirements: { type: 'string' } }
      },
      BookingSchedule: {
        type: 'object', required: ['pickupDate', 'expectedDeliveryDate'],
        properties: { pickupDate: { type: 'string', format: 'date-time' }, expectedDeliveryDate: { type: 'string', format: 'date-time' }, pickupTimeSlot: { type: 'string' } }
      }
    }
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'], summary: 'Check API and MongoDB status',
        responses: { 200: { description: 'API health and database connection state.' } }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'], summary: 'Sign in with login ID and password (all roles)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: { description: 'Access token, role and user profile.' }, 401: { description: 'Incorrect login ID or password.' }, 403: { description: 'Login or account disabled.' }, 429: { description: 'Locked after 5 wrong attempts (15 minutes).' } }
      }
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'], summary: 'Customer self-registration',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRegistration' } } } },
        responses: { 201: { description: 'Customer created and signed in.' }, 409: { description: 'Mobile number already registered.' } }
      }
    },
    '/api/v1/auth/session': {
      get: {
        tags: ['Authentication'], summary: 'Current role and account for the bearer token', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Role and user profile.' }, 401: { description: 'Session ended.' } }
      }
    },
    '/api/v1/auth/change-password': {
      post: {
        tags: ['Authentication'], summary: 'Change your own password (signs out other devices)', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'New access token for the current session.' }, 400: { description: 'Current password incorrect.' } }
      }
    },
    '/api/v1/auth/accounts/{role}/{profileId}': {
      parameters: [
        { name: 'role', in: 'path', required: true, schema: { type: 'string', enum: ['manager', 'driver', 'customer'] } },
        { name: 'profileId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      get: {
        tags: ['Authentication'], summary: 'Get the login for a manager, driver or customer', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Login details (account is null when none exists).' }, 403: { description: 'Managers cannot manage manager logins.' } }
      },
      put: {
        tags: ['Authentication'], summary: 'Create or update a login (set login ID, reset password, enable/disable)', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountUpsert' } } } },
        responses: { 200: { description: 'Login saved.' }, 409: { description: 'Login ID already taken.' } }
      }
    },
    '/api/v1/customers/auth/complete-profile': {
      post: {
        tags: ['Customer Portal'], summary: 'Complete the authenticated customer profile', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompleteProfile' } } } },
        responses: { 200: { description: 'Profile completed; identity data enters KYC review.' }, 400: { description: 'Invalid profile data.' } }
      }
    },
    '/api/v1/customers/auth/profile': {
      get: {
        tags: ['Customer Portal'], summary: 'Get customer auth profile', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Customer profile.' } }
      }
    },
    '/api/v1/customers/portal/dashboard': {
      get: {
        tags: ['Customer Portal'], summary: 'Get customer portal dashboard', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Profile completion and portal summary.' } }
      }
    },
    '/api/v1/customers/portal/profile': {
      get: {
        tags: ['Customer Portal'], summary: 'Get the authenticated customer profile', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Customer profile.' }, 401: { description: 'Customer token required.' } }
      },
      put: {
        tags: ['Customer Portal'], summary: 'Update customer profile', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, additionalProperties: true } } } },
        responses: { 200: { description: 'Profile updated; identity changes reset KYC to Pending.' }, 400: { description: 'Invalid profile fields.' } }
      }
    },
    '/api/v1/customers/portal/kyc/submit': {
      post: {
        tags: ['Customer Portal'], summary: 'Submit profile and required documents for KYC review', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'KYC submitted.' }, 409: { description: 'Profile or required documents are incomplete.' } }
      }
    },
    '/api/v1/customers/portal/kyc/documents': {
      get: {
        tags: ['Customer Portal'], summary: 'List the authenticated customer KYC documents', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Document metadata; file bytes are never included in the list.' } }
      },
      post: {
        tags: ['Customer Portal'], summary: 'Upload a PAN, GSTIN or address-proof document', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/KycDocumentUpload' } } } },
        responses: { 201: { description: 'Document stored privately in MongoDB GridFS.' }, 409: { description: 'Complete profile before upload.' }, 413: { description: 'File exceeds 5 MB.' }, 415: { description: 'File type/signature is unsupported.' } }
      }
    },
    '/api/v1/customers/portal/kyc/documents/{documentId}/download': {
      get: {
        tags: ['Customer Portal'], summary: 'Download an owned KYC document', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'documentId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Private document stream.' }, 404: { description: 'Document not found for this customer.' } }
      }
    },
    '/api/v1/customers/portal/preferences': {
      get: {
        tags: ['Customer Portal'], summary: 'Get customer notification preferences', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Customer preferences.' } }
      },
      put: {
        tags: ['Customer Portal'], summary: 'Update customer notification preferences', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, additionalProperties: true } } } },
        responses: { 200: { description: 'Preferences updated.' }, 400: { description: 'Invalid preferences.' } }
      }
    },
    '/api/v1/customers/portal/addresses': {
      get: {
        tags: ['Customer Portal'], summary: 'List customer addresses', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Saved addresses.' } }
      },
      post: {
        tags: ['Customer Portal'], summary: 'Add a customer address', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['address', 'city', 'state', 'pincode'], additionalProperties: true } } } },
        responses: { 201: { description: 'Address added.' }, 400: { description: 'Invalid address.' } }
      }
    },
    '/api/v1/customers/portal/addresses/{id}': {
      put: {
        tags: ['Customer Portal'], summary: 'Replace a saved customer address', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['address', 'city', 'state', 'pincode'], additionalProperties: true } } } },
        responses: { 200: { description: 'Address updated.' }, 404: { description: 'Address not found.' } }
      },
      delete: {
        tags: ['Customer Portal'], summary: 'Delete a saved customer address', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Address deleted.' }, 404: { description: 'Address not found.' } }
      }
    },
    '/api/v1/customers/management/summary': {
      get: {
        tags: ['Customer Management'], summary: 'Get customer and KYC counts', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Customer totals by account and KYC status.' }, 403: { description: 'Admin token required.' } }
      }
    },
    '/api/v1/customers/management/registrations': {
      get: {
        tags: ['Customer Management'], summary: 'List registered customer profiles', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }
        ],
        responses: { 200: { description: 'Paginated customer registrations.' }, 403: { description: 'Admin token required.' } }
      },
      post: {
        tags: ['Customer Management'], summary: 'Register a customer profile', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRegistration' } } } },
        responses: { 201: { description: 'Customer registered.' }, 400: { description: 'Invalid registration details.' }, 409: { description: 'Phone or GSTIN already exists.' } }
      }
    },
    '/api/v1/customers/management/registrations/{id}': {
      put: {
        tags: ['Customer Management'], summary: 'Update a registered customer profile', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRegistration' } } } },
        responses: { 200: { description: 'Customer profile updated.' }, 400: { description: 'Invalid registration details.' }, 404: { description: 'Customer not found.' }, 409: { description: 'Phone or GSTIN already exists.' } }
      }
    },
    '/api/v1/customers/management': {
      get: {
        tags: ['Customer Management'], summary: 'Search and filter customers', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['Pending', 'Active', 'Suspended'] } },
          { in: 'query', name: 'kycStatus', schema: { type: 'string', enum: ['NotSubmitted', 'Pending', 'Verified', 'Rejected'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }
        ],
        responses: { 200: { description: 'Paginated customer list.' }, 403: { description: 'Admin token required.' } }
      }
    },
    '/api/v1/customers/management/{id}': {
      get: {
        tags: ['Customer Management'], summary: 'Get a customer by ID', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Customer profile.' }, 404: { description: 'Customer not found.' } }
      },
      put: {
        tags: ['Customer Management'], summary: 'Update customer profile', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, additionalProperties: true } } } },
        responses: { 200: { description: 'Customer updated; identity changes reset KYC.' }, 409: { description: 'Phone already used by another customer.' } }
      }
    },
    '/api/v1/customers/management/{id}/status': {
      patch: {
        tags: ['Customer Management'], summary: 'Change customer account status', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerStatusUpdate' } } } },
        responses: { 200: { description: 'Status updated and activity logged.' }, 400: { description: 'Invalid status.' } }
      }
    },
    '/api/v1/customers/management/{id}/kyc': {
      patch: {
        tags: ['Customer Management'], summary: 'Approve or reject KYC after required documents are verified', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/KycReview' } } } },
        responses: { 200: { description: 'KYC review saved.' }, 409: { description: 'KYC is not pending review.' } }
      }
    },
    '/api/v1/customers/management/{id}/kyc/documents': {
      get: {
        tags: ['Customer Management'], summary: 'List a customer KYC document versions', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'KYC document metadata.' }, 403: { description: 'Admin token required.' } }
      }
    },
    '/api/v1/customers/management/{id}/kyc/documents/{documentId}/review': {
      patch: {
        tags: ['Customer Management'], summary: 'Verify or reject an uploaded KYC document', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'documentId', required: true, schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/KycReview' } } } },
        responses: { 200: { description: 'Document review saved.' }, 409: { description: 'Document is not awaiting review.' } }
      }
    },
    '/api/v1/customers/management/{id}/kyc/documents/{documentId}/download': {
      get: {
        tags: ['Customer Management'], summary: 'Admin download of customer KYC document', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'documentId', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Private document stream.' }, 404: { description: 'Document not found.' } }
      }
    },
    '/api/v1/customers/management/{id}/activities': {
      get: {
        tags: ['Customer Management'], summary: 'List customer activity and communication history', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'type', schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }
        ],
        responses: { 200: { description: 'Paginated activity history.' } }
      },
      post: {
        tags: ['Customer Management'], summary: 'Record a note, call, email, SMS or follow-up', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerActivity' } } } },
        responses: { 201: { description: 'Activity recorded.' }, 400: { description: 'Invalid activity or follow-up time.' } }
      }
    },
    '/api/v1/customers/management/{id}/activities/{activityId}/complete': {
      patch: {
        tags: ['Customer Management'], summary: 'Complete a customer follow-up', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'activityId', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Follow-up marked completed.' }, 404: { description: 'Follow-up not found.' } }
      }
    },
    '/api/v1/customers/booking/vehicle': {
      post: {
        tags: ['Bookings'], summary: 'Create a vehicle booking request', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingRequest' } } } },
        responses: { 201: { description: 'Booking created for an active customer with verified KYC.' }, 403: { description: 'Account inactive or KYC not verified.' }, 409: { description: 'Profile must be completed first.' } }
      }
    },
    '/api/v1/customers/booking/online': {
      post: {
        tags: ['Bookings'], summary: 'Create an online booking request', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingRequest' } } } },
        responses: { 201: { description: 'Booking created.' }, 403: { description: 'Account inactive or KYC not verified.' }, 409: { description: 'Profile must be completed first.' } }
      }
    },
    '/api/v1/customers/booking/calendar': {
      get: {
        tags: ['Bookings'], summary: 'Get booking calendar (admin only)', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'startDate', required: true, schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', required: true, schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'branchId', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Bookings for the requested period.' }, 403: { description: 'Admin token required.' } }
      }
    },
    '/api/v1/customers/booking': {
      get: {
        tags: ['Bookings'], summary: 'List the authenticated customer bookings', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Paginated bookings owned by the authenticated customer.' } }
      }
    },
    '/api/v1/customers/booking/{bookingId}/history': {
      get: {
        tags: ['Bookings'], summary: 'Get status history for an owned booking', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookingId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Booking status timeline.' }, 404: { description: 'Booking not found for this customer.' } }
      }
    },
    '/api/v1/customers/booking/{bookingId}': {
      get: {
        tags: ['Bookings'], summary: 'Get one booking owned by the authenticated customer', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookingId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Booking details.' }, 404: { description: 'Booking not found for this customer.' } }
      }
    },
    '/api/v1/customers/booking/{bookingId}/status': {
      patch: {
        tags: ['Bookings'], summary: 'Update booking status (admin only)', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'bookingId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' }, remarks: { type: 'string' } } } } } },
        responses: { 200: { description: 'Status changed and audited.' }, 400: { description: 'Invalid booking status transition.' }, 403: { description: 'Admin token required.' } }
      }
    },
    '/api/v1/drivers': {
      get: {
        tags: ['Driver Management'], summary: 'List and search drivers (admin only)', security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'driverStatus', schema: { type: 'string' } },
          { in: 'query', name: 'employmentType', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Paginated driver records.' }, 401: { description: 'Bearer token required.' }, 403: { description: 'Admin token required.' } }
      },
      post: {
        tags: ['Driver Management'], summary: 'Register a driver (admin only)', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['personalInfo', 'contactInfo', 'employmentDetails'], properties: { personalInfo: { type: 'object' }, contactInfo: { type: 'object' }, emergencyContact: { type: 'object' }, employmentDetails: { type: 'object' }, driverStatus: { type: 'string' }, notes: { type: 'string' } } } } } },
        responses: { 201: { description: 'Driver registered with a generated driver code.' }, 400: { description: 'Invalid driver data.' }, 409: { description: 'Phone number already belongs to a driver.' } }
      }
    },
    '/api/v1/drivers/{driverId}': {
      get: {
        tags: ['Driver Management'], summary: 'Get driver details', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'driverId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Driver profile.' }, 404: { description: 'Driver not found.' } }
      },
      patch: {
        tags: ['Driver Management'], summary: 'Update driver profile', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'driverId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Driver profile updated.' }, 400: { description: 'Invalid profile data.' }, 409: { description: 'Phone number is already in use.' } }
      },
      delete: {
        tags: ['Driver Management'], summary: 'Soft-delete a driver', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'driverId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Driver deactivated and soft-deleted.' }, 409: { description: 'Assigned or on-trip drivers cannot be deleted.' } }
      }
    },
    '/api/v1/drivers/{driverId}/status': {
      patch: {
        tags: ['Driver Management'], summary: 'Change a driver operational status', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'driverId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['driverStatus'], properties: { driverStatus: { type: 'string', enum: ['Available', 'OnLeave', 'Inactive', 'Suspended'] } } } } } },
        responses: { 200: { description: 'Driver status updated.' }, 409: { description: 'Trip-assignment statuses are managed by trip workflows.' } }
      }
    },
    '/api/v1/drivers/licenses': {
      get: { tags: ['Driver Management'], summary: 'List driver licence records', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paginated licence records.' } } },
      post: {
        tags: ['Driver Management'], summary: 'Create a driver licence record', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['driverId', 'licenseNumber', 'licenseType', 'expiryDate'], properties: { driverId: { type: 'string' }, licenseNumber: { type: 'string' }, licenseType: { type: 'string' }, issueDate: { type: 'string', format: 'date' }, expiryDate: { type: 'string', format: 'date' }, status: { type: 'string' } } } } } },
        responses: { 201: { description: 'Licence record created.' }, 400: { description: 'Invalid licence data.' }, 409: { description: 'Duplicate licence for this driver.' } }
      }
    },
    '/api/v1/drivers/licenses/{recordId}': {
      patch: {
        tags: ['Driver Management'], summary: 'Update a driver licence record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Licence record updated.' }, 404: { description: 'Licence record not found.' } }
      },
      delete: {
        tags: ['Driver Management'], summary: 'Soft-delete a driver licence record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Licence record deleted.' } }
      }
    },
    '/api/v1/drivers/licenses/{recordId}/status': {
      patch: {
        tags: ['Driver Management'], summary: 'Update licence review status', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Valid', 'ExpiringSoon', 'Expired', 'UnderReview'] } } } } } },
        responses: { 200: { description: 'Licence status updated.' } }
      }
    },
    '/api/v1/drivers/documents': {
      get: { tags: ['Driver Management'], summary: 'List driver document records', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paginated document records; binary uploads are not configured.' } } },
      post: {
        tags: ['Driver Management'], summary: 'Create a driver document record', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['driverId', 'documentType'], properties: { driverId: { type: 'string' }, documentType: { type: 'string' }, documentNumber: { type: 'string' }, issueDate: { type: 'string', format: 'date' }, expiryDate: { type: 'string', format: 'date' }, fileUrl: { type: 'string', format: 'uri' } } } } } },
        responses: { 201: { description: 'Document record created.' }, 400: { description: 'Invalid document data.' } }
      }
    },
    '/api/v1/drivers/documents/{recordId}': {
      patch: {
        tags: ['Driver Management'], summary: 'Update a driver document record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Document record updated.' }, 404: { description: 'Document record not found.' } }
      },
      delete: {
        tags: ['Driver Management'], summary: 'Soft-delete a driver document record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Document record deleted.' } }
      }
    },
    '/api/v1/drivers/attendance': {
      get: { tags: ['Driver Management'], summary: 'List attendance records', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paginated attendance records.' } } },
      post: {
        tags: ['Driver Management'], summary: 'Record driver attendance', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['driverId', 'attendanceDate', 'status'], properties: { driverId: { type: 'string' }, attendanceDate: { type: 'string', format: 'date' }, status: { type: 'string', enum: ['Present', 'Absent', 'OnLeave', 'HalfDay'] }, checkIn: { type: 'string', pattern: '^([01]\\\\d|2[0-3]):[0-5]\\\\d$' }, checkOut: { type: 'string' }, remarks: { type: 'string' } } } } } },
        responses: { 201: { description: 'Attendance recorded.' }, 400: { description: 'Invalid attendance data.' }, 409: { description: 'Attendance already exists for the driver and date.' } }
      }
    },
    '/api/v1/drivers/attendance/{recordId}': {
      patch: {
        tags: ['Driver Management'], summary: 'Update a driver attendance record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Attendance record updated.' }, 404: { description: 'Attendance record not found.' } }
      },
      delete: {
        tags: ['Driver Management'], summary: 'Soft-delete an attendance record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Attendance record deleted.' } }
      }
    },
    '/api/v1/drivers/attendance/{recordId}/status': {
      patch: {
        tags: ['Driver Management'], summary: 'Update attendance status', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Present', 'Absent', 'OnLeave', 'HalfDay'] } } } } } },
        responses: { 200: { description: 'Attendance status updated.' }, 400: { description: 'Present attendance requires valid check-in/check-out times.' } }
      }
    },
    '/api/v1/drivers/payments': {
      get: { tags: ['Driver Management'], summary: 'List driver pay records', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paginated pay records with calculated net amounts.' } } },
      post: {
        tags: ['Driver Management'], summary: 'Create a driver pay-period record', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['driverId', 'periodStart', 'periodEnd', 'baseAmount'], properties: { driverId: { type: 'string' }, periodStart: { type: 'string', format: 'date' }, periodEnd: { type: 'string', format: 'date' }, baseAmount: { type: 'number', minimum: 0 }, allowances: { type: 'number', minimum: 0 }, deductions: { type: 'number', minimum: 0 }, status: { type: 'string', enum: ['Draft', 'Approved', 'Paid', 'OnHold'] } } } } } },
        responses: { 201: { description: 'Pay record created.' }, 400: { description: 'Invalid pay period or amount.' }, 409: { description: 'A pay record already exists for this driver and period.' } }
      }
    },
    '/api/v1/drivers/payments/{recordId}': {
      patch: {
        tags: ['Driver Management'], summary: 'Update a driver pay record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Pay record updated.' }, 409: { description: 'Paid records cannot be edited.' } }
      },
      delete: {
        tags: ['Driver Management'], summary: 'Soft-delete a driver pay record', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pay record deleted.' }, 409: { description: 'Paid records cannot be deleted.' } }
      }
    },
    '/api/v1/drivers/payments/{recordId}/status': {
      patch: {
        tags: ['Driver Management'], summary: 'Advance driver pay status', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'recordId', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Draft', 'Approved', 'Paid', 'OnHold'] } } } } } },
        responses: { 200: { description: 'Pay status changed.' }, 409: { description: 'Invalid status transition.' } }
      }
    },
    '/api/v1/drivers/performance': {
      get: {
        tags: ['Driver Management'], summary: 'Get attendance-based driver metrics', security: [{ BearerAuth: [] }],
        parameters: [{ in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } }, { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'Actual driver and attendance metrics; trip-performance metrics require trip records.' } }
      }
    },
    '/api/v1/reports/driver': {
      get: {
        tags: ['Driver Management'], summary: 'Get attendance-based driver report', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Attendance metrics calculated from recorded data.' } }
      }
    }
  }
};