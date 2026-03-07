# How to Unit Test a Service

## Goal
Test business logic in isolation. Mock every dependency. Each test = one behavior.

## File Location
```
modules/org/
└── __tests__/
    └── org.service.spec.ts
```

## Template
```typescript
import { Test } from '@nestjs/testing';
import { OrgService } from '../org.service';
import { PrismaService } from '@/common/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('OrgService', () => {
  let service: OrgService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrgService,
        {
          provide: PrismaService,
          useValue: {
            organization: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(OrgService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create an org with generated slug', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue(mockOrg);

      const result = await service.create({ name: 'Acme Corp' });

      expect(result.slug).toBe('acme-corp');
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Acme Corp' }) }),
      );
    });

    it('should throw ConflictException on duplicate slug', async () => {
      prisma.organization.findUnique.mockResolvedValue(existingOrg);

      await expect(service.create({ name: 'Acme Corp' })).rejects.toThrow(ConflictException);
    });
  });
});
```

## What to Test
- **Happy path**: correct input → expected output.
- **Edge cases**: empty arrays, null optional fields, boundary values.
- **Error paths**: duplicate data → ConflictException, missing data → NotFoundException.
- **Side effects**: verify the right Prisma method was called with the right args.

## What NOT to Test
- Prisma itself (it's a third-party library).
- NestJS framework behavior (routing, DI).
- Things already covered by TypeScript (wrong argument types).

## Rules
- Each `describe` block = one method.
- Each `it` block = one behavior, named as a sentence.
- `beforeEach` resets all mocks — tests must be independent.
- No shared mutable state between tests.
