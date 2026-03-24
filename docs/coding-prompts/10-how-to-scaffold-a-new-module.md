# How to Scaffold a New Module

## When You Need a New Module
When a new domain concept needs its own controller, service, and data model. Examples: `auth`, `org`, `entitlement`, `guard`, `audit`.

## Step-by-Step

### 1. Create the folder structure
```
apps/api/src/modules/{name}/
├── {name}.module.ts
├── {name}.controller.ts
├── {name}.service.ts
├── dto/
│   └── create-{name}.dto.ts
├── __tests__/
│   ├── {name}.service.spec.ts
│   └── {name}.controller.spec.ts
└── index.ts
```

### 2. Define the module
```typescript
// {name}.module.ts
import { Module } from '@nestjs/common';
import { NameController } from './{name}.controller';
import { NameService } from './{name}.service';

@Module({
  controllers: [NameController],
  providers: [NameService],
  exports: [NameService], // Only if other modules need this service
})
export class NameModule {}
```

### 3. Create the barrel export
```typescript
// index.ts
export { NameModule } from './{name}.module';
export type { CreateNameDto } from './dto/create-{name}.dto';
```

### 4. Register in AppModule
```typescript
// app.module.ts
import { NameModule } from './modules/{name}';

@Module({
  imports: [
    // ... existing modules
    NameModule,
  ],
})
export class AppModule {}
```

### 5. Add Prisma model (if needed)
Add the model to `packages/prisma-client/prisma/schema.prisma`, then:
```bash
cd packages/prisma-client
npx prisma migrate dev --name add-{name}-model
```

## Checklist Before Done
- [ ] Module registered in `AppModule`
- [ ] Controller has at least a health/stub endpoint
- [ ] Service has typed method stubs
- [ ] DTOs have class-validator decorators
- [ ] Barrel export created
- [ ] At least one spec file exists
