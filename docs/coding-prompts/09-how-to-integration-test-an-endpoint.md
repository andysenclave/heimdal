# How to Integration Test an Endpoint

## Goal
Test the full HTTP lifecycle: request → validation → service → database → response. No mocks for the service layer.

## File Location
```
modules/org/
└── __tests__/
    └── org.e2e-spec.ts
```

## Template
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/common/prisma.service';

describe('Org Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.organization.deleteMany(); // Clean slate
  });

  describe('POST /api/v1/orgs', () => {
    it('should create org and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orgs')
        .send({ name: 'Acme Corp' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Acme Corp',
        slug: 'acme-corp',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should reject invalid body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orgs')
        .send({}) // missing required `name`
        .expect(400);
    });
  });
});
```

## What to Integration Test
- **Happy path**: valid request → correct status + response shape.
- **Validation**: missing/invalid fields → 400.
- **Auth**: missing/expired token → 401. Wrong role → 403.
- **Not found**: invalid ID → 404.
- **Conflict**: duplicate unique fields → 409.

## When to Use Integration vs Unit
- **Unit test** the service for complex business logic branching.
- **Integration test** the endpoint for request validation, auth, and response shape.
- If a behavior is tested in unit tests, a simple happy-path integration test is enough.
