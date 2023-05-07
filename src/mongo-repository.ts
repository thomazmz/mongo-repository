import { 
  Collection as MongodbCollection,
  Document as MongodbDocument,
  ObjectId as MongodbObjectId,
  WithId as MongodbWithId,
  Filter as MongodbFilter,
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
  ValueObject,
} from '@thomazmz/core-context'

export class MongoRepository<E extends Entity<any>> implements Repository<E> {
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

  private async try<ReturnType>(fn: () => Promise<ReturnType>): Promise<ReturnType> {
    try {
      return await fn()
    } catch (error) {
      if(error instanceof RepositoryError) {
        throw error
      }
      // TODO: improve error throwing
      throw new RepositoryError()
    }
  }

  private resolveUpdateProperties = (updateInput: Partial<EntityProperties<E>>): ValueObject => {
    const { id, createdAt, updatedAt, ...updatableProperties } = updateInput as any
    return { ...updatableProperties, updatedAt: new Date() } as ValueObject
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
    return this.try(async () => {
      const currentDate = new Date()
  
      const timestamps = {
        createdAt: currentDate,
        upadtedAt: currentDate,
      } as const
  
      const { insertedId } = await this.collection.insertOne({
        ...timestamps,
        ...properties,
      })
  
      return this.convertDocumentToEntity({ ...properties, ...timestamps, _id: insertedId })
    })
  }

  public async createMany(properties: EntityProperties<E>[]): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async updateById(id: E['id'], properties: Partial<EntityProperties<E>>): Promise<E> {
    return this.try(async () => {
      const mongoFilter = this.parseIdAsDocumentFilter(id)

      const propertiesToUpdate = {
        $set: this.resolveUpdateProperties(properties)
      } as const

      const mongodbUpdateOptions = {
        returnDocument: 'after'
      } as const

      const { value: document } = await this.collection.findOneAndUpdate(
        mongoFilter, 
        propertiesToUpdate, 
        mongodbUpdateOptions,
      )

      if(!document) {
        // TODO: improve error throwing
        throw new RepositoryError(`Could not update entity. Could not find a entity with id ${id}.`)
      }

      return this.convertDocumentToEntity(document)
    })
  }

  public async updateByIds(ids: E['id'][], properties: EntityPropertiesPartial<E>): Promise<E[]> {
    return this.try(async () => {
      const mongoFilter = this.parseIdsAsDocumentFilter(ids)

      const propertiesToUpdate = {
        $set: this.resolveUpdateProperties(properties)
      } as const

      await this.collection.updateMany(
        mongoFilter,
        propertiesToUpdate,
      )

      // TODO: Wrap collection calls into a transaction
      // TODO: Use find operation directly instead of calling getById
      return this.getByIds(ids)
    })
  }

  public async updateByFilter(filter: Filter<E>, properties: Partial<EntityProperties<E>>): Promise<E[]> {
    throw new Error('Method not implemented.')
  }

  public async deleteById(id: E['id']): Promise<void> {
    return this.try(async () => {
      if(!this.isValidObjectId(id)) {
        return
      }
  
      const mongoFilter = this.parseIdAsDocumentFilter(id)
      await this.collection.deleteOne(mongoFilter)
    })
  }

  public async deleteByIds(ids: E['id'][]): Promise<void> {
    return this.try(async () => {
      const validIds = ids.filter(this.isValidObjectId)

      if(validIds.length === 0) {
        return
      }

      const mongoFilter = this.parseIdsAsDocumentFilter(ids)

      await this.collection.deleteMany(mongoFilter)
    })
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
