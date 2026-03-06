import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OrgService {
  private readonly logger = new Logger(OrgService.name);

  /**
   * Create a new organization.
   * Full implementation in HD-013 (Week 2).
   */
  async create(_body: Record<string, unknown>) {
    this.logger.log('Create org — stub');
    return { message: 'Org module ready. CRUD implementation pending (HD-013).' };
  }

  async findAll() {
    this.logger.log('List orgs — stub');
    return [];
  }

  async findOne(id: string) {
    this.logger.log(`Get org ${id} — stub`);
    return { id, message: 'stub' };
  }

  async update(id: string, _body: Record<string, unknown>) {
    this.logger.log(`Update org ${id} — stub`);
    return { id, message: 'updated (stub)' };
  }

  async remove(id: string) {
    this.logger.log(`Remove org ${id} — stub`);
    return { id, message: 'soft-deleted (stub)' };
  }
}
