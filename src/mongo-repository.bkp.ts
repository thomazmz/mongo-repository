import { 
  Collection as MongodbCollection,
  Document as MongodbDOcument,
  ObjectId as MongodbObjectId,
  Filter as MongodbFilter,
  WithId as MongodbWithId,
} from 'mongodb'

import { 
  Entity,
  EntityProperties,
  EntityPropertiesPartial,
  Filter,
  Identifier,
  Query,
  Repository,
  RepositoryError
} from '@thomazmz/core-context'


export class MongoRepository<E extends Entity> implements Repository<E> {
  constructor(private readonly collection: MongodbCollection) {}

  protected createObjectIdFromIdentifier(
    identifier: Identifier
  ): MongodbObjectId {
    return new MongodbObjectId(identifier);
  }

  protected createObjectIdsFromIdentifiers(
    identifiers: Identifier[]
  ): MongodbObjectId[] {
    return identifiers.map(this.createObjectIdFromIdentifier);
  }

  protected convertDocumentToEntity(
    document: MongodbWithId<MongodbDOcument>
  ): E {
    const { _id, ...object } = document;
    return { ...object, id: _id.toString() } as E;
  }

  protected convertDocumentsToEntities(
    documents: MongodbWithId<MongodbDOcument>[]
  ): E[] {
    return documents.map((document) => this.convertDocumentToEntity(document));
  }

  protected parseIdAsDocumentFilter(
    id: E["id"]
  ): MongodbFilter<MongodbDOcument> {
    return { _id: this.createObjectIdFromIdentifier(id) };
  }

  protected parseIdsAsDocumentFilter(
    ids: E["id"][]
  ): MongodbFilter<MongodbDOcument> {
    return { _id: { $in: this.createObjectIdsFromIdentifiers(ids) } };
  }

  protected parseEntityFilterAsDocumentFilter(
    entityFilter: Filter<E>
  ): MongodbFilter<MongodbDOcument> {
    return Object.entries(entityFilter).reduce((filter, [key, value]) => {
      return { ...filter, [key]: { $eq: value } };
    }, {});
  }

  protected parseQuery(entityFilter: Query<E>): MongodbFilter<MongodbDOcument> {
    throw new Error("Method not implemented.");
  }

  public async get(): Promise<E[]>;
  public async get(id: E["id"]): Promise<E>;
  public async get(ids: E["id"][]): Promise<E[]>;
  public async get(filter: Filter<E>): Promise<E[]>;
  public async get(query: Query<E>): Promise<E[]>;
  public async get(getParameter?: unknown): Promise<E | E[]> {
    throw new Error("Method not implemented.");
  }

  public async create(properties: EntityProperties<E>): Promise<E>;
  public async create(properties: EntityProperties<E>[]): Promise<E[]>;
  public async create(createParameter: unknown): Promise<E | E[]> {
    throw new Error("Method not implemented.");
  }

  public async update(
    id: E["id"],
    properties: Partial<EntityProperties<E>>
  ): Promise<E>;
  public async update(
    ids: E["id"][],
    properties: Partial<EntityProperties<E>>
  ): Promise<E[]>;
  public async update(
    filter: Filter<E>,
    properties: Partial<EntityProperties<E>>
  ): Promise<E[]>;
  public async update(
    updtedaParameter: unknown,
    properties: unknown
  ): Promise<E | E[]> {
    throw new Error("Method not implemented.");
  }

  public async delete(id: E["id"]): Promise<void>;
  public async delete(ids: E["id"][]): Promise<void>;
  public async delete(filter: Filter<E>): Promise<void>;
  public async delete(deleteParameter: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async count(filter?: Filter<E>): Promise<number> {
    throw new Error("Method not implemented.");
  }

  public async countAll(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  public async countByFilter(filter: Filter<E>): Promise<number> {
    throw new Error("Method not implemented.");
  }

  public async createOne(properties: EntityProperties<E>): Promise<E> {
    const currentDate = new Date();

    const documentProperties = {
      ...properties,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    const { insertedId } = await this.collection.insertOne(documentProperties);

    return { ...documentProperties, id: insertedId.toHexString() } as E;
  }

  public async createMany(properties: EntityProperties<E>[]): Promise<E[]> {
    const currentDate = new Date();

    const documentProperties = properties.map((properties) => ({
      ...properties,
      createdAt: currentDate,
      updatedAt: currentDate,
    }));

    const { insertedIds } = await this.collection.insertMany(
      documentProperties,
      {
        ordered: true,
      }
    );

    return Object.values(insertedIds).map((insertedId, index) => {
      return {
        ...documentProperties[index],
        id: insertedId.toHexString(),
      } as E;
    });
  }

  public async updateById(
    id: E["id"],
    properties: Partial<EntityProperties<E>>
  ): Promise<E> {
    const mongoFilter = this.parseIdAsDocumentFilter(id);
    const { value: document } = await this.collection.findOneAndUpdate(
      mongoFilter,
      { ...properties }
    );

    if (!document) {
      throw new RepositoryError(
        `Could not update entity. Could not find a entity with id ${id}.`
      );
    }

    return this.convertDocumentToEntity(document);
  }

  public async updateByIds(
    ids: E["id"][],
    properties: EntityPropertiesPartial<E>
  ): Promise<E[]> {
    const mongoFilter = this.parseIdsAsDocumentFilter(ids);
    await this.collection.updateMany(mongoFilter, { ...properties });

    return this.getByIds(ids);
  }

  public async updateByFilter(
    filter: Filter<E>,
    properties: Partial<EntityProperties<E>>
  ): Promise<E[]> {
    const mongoFilter = this.parseEntityFilterAsDocumentFilter(filter);
    await this.collection.updateMany(mongoFilter, properties);
    return this.getByFilter(filter);
  }

  public async deleteById(id: E["id"]): Promise<void> {
    const mongoFilter = this.parseIdAsDocumentFilter(id);
    await this.collection.deleteOne(mongoFilter);
  }

  public async deleteByIds(ids: E["id"][]): Promise<void> {
    const parsedIds = this.parseIdsAsDocumentFilter(ids);
    await this.collection.deleteMany(parsedIds);
  }

  public async deleteByFilter(filter: Filter<E>): Promise<void> {
    const mongoFilter = this.parseEntityFilterAsDocumentFilter(filter);
    await this.collection.deleteMany(mongoFilter);
  }

  public async getAll(): Promise<E[]> {
    const documents = await this.collection.find().toArray();
    return this.convertDocumentsToEntities(documents);
  }

  public async getById(id: E["id"]): Promise<E | undefined> {
    const mongoFilter = this.parseIdAsDocumentFilter(id);
    const document = await this.collection.findOne(mongoFilter);

    if (!document) {
      return undefined;
    }

    return this.convertDocumentToEntity(document);
  }

  public async getByIds(ids: E["id"][]): Promise<E[]> {
    const mongoFilter = this.parseIdsAsDocumentFilter(ids);
    const documents = await this.collection.find(mongoFilter).toArray();
    return this.convertDocumentsToEntities(documents);
  }

  public async getByFilter(filter: Filter<E>): Promise<E[]> {
    const mongoFilter = this.parseEntityFilterAsDocumentFilter(filter);
    const documents = await this.collection.find(mongoFilter).toArray();
    return this.convertDocumentsToEntities(documents);
  }

  public async getByQuery(query: Query<E>): Promise<E[]> {
    const mongoFilter = this.parseQuery(query);
    const documents = await this.collection.find(mongoFilter).toArray();
    return this.convertDocumentsToEntities(documents);
  }
}
