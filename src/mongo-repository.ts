import { 
  Collection as MongodbCollection,
  Document as MongodbDocument,
  WithId as MongodbWithId,
} from 'mongodb'

import { 
  Entity,
  EntityProperties,
  EntityPropertiesPartial,
  Filter,
  Query,
  Repository,
} from '@thomazmz/core-context'


export class MongoRepository<E extends Entity> implements Repository<E> {
  constructor(
    private readonly collection: MongodbCollection
  ) {}

  public async get(): Promise<E[]>
  public async get(id: E['id']): Promise<E>
  public async get(ids: E['id'][]): Promise<E[]>
  public async get(filter: Filter<E>): Promise<E[]>
  public async get(query: Query<E>): Promise<E[]>
  public async get(getParameter?: unknown): Promise<E | E[]> {
    throw new Error('Method not implemented.')
  }

  protected convertDocumentToEntity(document: MongodbWithId<MongodbDocument>): E {
    const { _id, ...object } = document
    return { ...object, id: _id.toString() } as E
  }
  
  protected convertDocumentsToEntities(documents: MongodbWithId<MongodbDocument>[]): E[] {
    return documents.map(document => this.convertDocumentToEntity(document))
  }

  public async create(properties: EntityProperties<E>): Promise<E>
  public async create(properties: EntityProperties<E>[]): Promise<E[]>
  public async create(createParameter: unknown): Promise<E | E[]> {
    throw new Error('Method not implemented.')
  }

  public async update(id: E['id'], properties: Partial<EntityProperties<E>>): Promise<E>
  public async update(ids: E['id'][], properties: Partial<EntityProperties<E>>): Promise<E[]>
  public async update(filter: Filter<E>, properties: Partial<EntityProperties<E>>): Promise<E[]>
  public async update(updtedaParameter: unknown, properties: unknown): Promise<E | E[]> {
    throw new Error('Method not implemented.')
  }

  public async delete(id: E['id']): Promise<void>
  public async delete(ids: E['id'][]): Promise<void>
  public async delete(filter: Filter<E>): Promise<void>
  public async delete(deleteParameter: unknown): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public async count(filter?: Filter<E>): Promise<number> {
    throw new Error('Method not implemented.')
  }

  public async countAll(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  public async countByFilter(filter: Filter<E>): Promise<number> {
    throw new Error('Method not implemented.')
  }

  public async createOne(properties: EntityProperties<E>): Promise<E> {
    throw new Error('Method not implemented.')
  }

  public async createMany(properties: EntityProperties<E>[]): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async updateById(id: E['id'], properties: Partial<EntityProperties<E>>): Promise<E> {
    throw new Error('Method not implemented.')
  }

  public async updateByIds(ids: E['id'][], properties: EntityPropertiesPartial<E>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async updateByFilter(filter: Filter<E>, properties: Partial<EntityProperties<E>>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async deleteById(id: E['id']): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public async deleteByIds(ids: E['id'][]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public async deleteByFilter(filter: Filter<E>): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public async getAll(): Promise<E[]> {
    const documents = await this.collection.find().toArray()
    return this.convertDocumentsToEntities(documents)
  }

  public async getById(id: E['id']): Promise<E | undefined> {
    throw new Error('Method not implemented.')
  }

  public async getByIds(ids: E['id'][]): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async getByFilter(filter: Filter<E>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async getByQuery(query: Query<E>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }
}
