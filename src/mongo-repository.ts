import { 
  Collection as MongodbCollection,
  Document as MongodbDocument,
  ObjectId as MongodbObjectId,
  WithId as MongodbWithId,
  Filter as MongodbFilter
} from 'mongodb'

import {
  Entity,
  EntityProperties,
  EntityPropertiesPartial,
  Filter,
  Identifier,
  Query,
  Repository,
  RepositoryError,
} from '@thomazmz/core-context'

export class MongoRepository<E extends Entity> implements Repository<E> {
  constructor(
    private readonly collection: MongodbCollection
  ) {}

  protected convertDocumentToEntity(document: MongodbWithId<MongodbDocument>): E {
    const { _id, ...object } = document
    return { ...object, id: _id.toString() } as E
  }
  
  protected convertDocumentsToEntities(documents: MongodbWithId<MongodbDocument>[]): E[] {
    return documents.map(document => this.convertDocumentToEntity(document))
  }

  protected parseIdAsDocumentFilter(id: E['id']): MongodbFilter<MongodbDocument> {
    return { _id: this.createObjectIdFromIdentifier(id) }
  }

  protected parseIdsAsDocumentFilter(ids: E['id'][]): MongodbFilter<MongodbDocument> {
    return { _id: { $in: this.createObjectIdsFromIdentifiers(ids) }}
  }

  protected createObjectIdFromIdentifier(identifier: Identifier): MongodbObjectId {
    return new MongodbObjectId(identifier)
  }

  protected createObjectIdsFromIdentifiers(identifiers: Identifier[]): MongodbObjectId[] {
    return identifiers.map(this.createObjectIdFromIdentifier)
  }

  protected isValidObjectId(idCandidate: Identifier): boolean {
    return MongodbObjectId.isValid(idCandidate)
  }
  
  protected async try<ReturnType extends any>(repositoryFunction: () => Promise<ReturnType>): Promise<ReturnType> {
    try {
      return await repositoryFunction()
    } catch (error) {
      throw new RepositoryError()
    }
  }

  public async get(): Promise<E[]>
  public async get(id: E['id']): Promise<E>
  public async get(ids: E['id'][]): Promise<E[]>
  public async get(filter: Filter<E>): Promise<E[]>
  public async get(query: Query<E>): Promise<E[]>
  public async get(getParameter?: unknown): Promise<E | E[]> {
    throw new Error('Method not implemented.')
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
    return this.try(async () => {
      const documents = await this.collection.find().toArray()
      return this.convertDocumentsToEntities(documents)
    })
  }

  public async getById(id: E['id']): Promise<E | undefined> {
    return this.try(async () => {
      if(!this.isValidObjectId(id)) {
        return undefined
      }

      const mongoFilter = this.parseIdAsDocumentFilter(id)
      const document = await this.collection.findOne(mongoFilter)
  
      if(!document) {
        return undefined
      }
  
      return this.convertDocumentToEntity(document)
    })
  }

  public async getByIds(ids: E['id'][]): Promise<E[]> {
    return this.try(async () => {
      const validIds = ids.filter(this.isValidObjectId)

      if(validIds.length === 0) {
        return []
      }

      const mongoFilter = this.parseIdsAsDocumentFilter(ids)

      const documents = await this.collection.find(mongoFilter).toArray()

      return this.convertDocumentsToEntities(documents)
    })
  }

  public async getByFilter(filter: Filter<E>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async getByQuery(query: Query<E>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }
}
