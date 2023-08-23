import { Collection, Document, ObjectId, WithId, Filter } from "mongodb";
import {
  Entity,
  Identifier,
  EntityProperties,
  EntityPropertiesPartial,
  RepositoryError,
  arrayUtils,
  Repository,
  Callback,
} from "@thomazmz/core-context";

import EventEmitter from "events";

export class MongoRepository<E extends Entity<any>> implements Repository<E> {
  private readonly eventEmitter: EventEmitter = new EventEmitter();

  constructor(private readonly collection: Collection) {}

  protected async executeRepositoryOperation<ReturnType>(
    asyncCallback: () => Promise<ReturnType>
  ): Promise<ReturnType> {
    return asyncCallback().catch((error) => {
      console.log(error);
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError();
    });
  }

  protected convertDocumentsToEntities(documents: WithId<Document>[]): E[] {
    return documents.map((document) => this.convertDocumentToEntity(document));
  }

  protected convertDocumentToEntity(document: WithId<Document>): E {
    const { _id, ...object } = document;
    return { ...object, id: _id.toString() } as E;
  }

  protected convertIdentifiersToDocumentFilter(ids: E["id"][]): Filter<Document> {
    return { _id: { $in: this.convertToObjectIds(ids) } };
  }

  protected convertIdentifierToDocumentFilter(id: E["id"]): Filter<Document> {
    return { _id: this.convertToObjectId(id) };
  }

  protected convertEntityFilterToDocumentFilter(
    entityFilter: Filter<E>
  ): Filter<Document> {
    return Object.entries(entityFilter).reduce((filter, [key, value]) => {
      if (!value) {
        return { ...filter, ["$or"]: [{ [key]: null }, { [key]: { $exists: false } }] };
      }

      return { ...filter, [key]: { $eq: value } };
    }, {});
  }

  protected convertToObjectId(identifier: Identifier): ObjectId {
    return new ObjectId(identifier);
  }

  protected convertToObjectIds(identifiers: Identifier[]): ObjectId[] {
    return identifiers.map(this.convertToObjectId);
  }

  protected filterValidIdentifiers(candidates: Identifier[]): Identifier[] {
    return candidates.filter(this.validIdentifier);
  }

  protected resolvePropertiesToSet(properties: EntityPropertiesPartial<E>) {
    return Object.entries(properties).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) {
        return acc;
      }

      return { ...acc, [key]: value };
    }, {});
  }

  protected resolvePropertiesToUnset(properties: EntityPropertiesPartial<E>) {
    return Object.entries(properties).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        return acc;
      }

      return { ...acc, [key]: "" };
    }, {});
  }

  protected validIdentifier(identifier: Identifier) {
    return ObjectId.isValid(identifier);
  }

  public async createOne(properties: EntityProperties<E>): Promise<E> {
    return this.executeRepositoryOperation(async () => {
      const currentDate = new Date();

      const timestamps = {
        createdAt: currentDate,
        upadtedAt: currentDate,
      } as const;

      const { insertedId } = await this.collection.insertOne({
        ...timestamps,
        ...properties,
      });

      const entity = this.convertDocumentToEntity({
        ...properties,
        ...timestamps,
        _id: insertedId,
      });

      this.emitCreatedEntity(entity)

      return entity
    });
  }

  public async createMany(properties: EntityProperties<E>[]): Promise<E[]> {
    return this.executeRepositoryOperation(async () => {

      if (properties.length === 0) {
        return [];
      }

      const currentDate = new Date();

      const timestamps = {
        createdAt: currentDate,
        upadtedAt: currentDate,
      } as const;

      const timestampedProperties = properties.map((entityProperties) => ({
        ...entityProperties,
        ...timestamps,
      }));

      const insertOptions = {
        ordered: true,
      } as const;

      const insertResponse = await this.collection.insertMany(
        timestampedProperties,
        insertOptions,
      );

      const insertedIds = Object.values(insertResponse.insertedIds);

      const entities = arrayUtils.merge(
        timestampedProperties,
        insertedIds,
        (documentWithoutId, objectId) => {
          if (!documentWithoutId || !objectId) {
            // TODO: improve error throwing
            throw new RepositoryError();
          }

          return this.convertDocumentToEntity({
            ...documentWithoutId,
            _id: objectId,
          });
        }
      );

      for (const entity of entities) {
        this.emitCreatedEntity(entity)
      }

      return entities
    });
  }

  public async updateById(
    id: E["id"],
    properties: Partial<EntityProperties<E>>
  ): Promise<E> {
    return this.executeRepositoryOperation(async () => {
      const mongoDocumentFilter = this.convertIdentifierToDocumentFilter(id);

      const propertiesToUpdate = {
        $set: this.resolvePropertiesToSet(properties),
        $unset: this.resolvePropertiesToUnset(properties),
      } as const;

      const mongodbUpdateOptions = {
        returnDocument: "after",
      } as const;

      const { value: document } = await this.collection.findOneAndUpdate(
        mongoDocumentFilter,
        propertiesToUpdate,
        mongodbUpdateOptions
      );

      if (!document) {
        // TODO: improve error throwing
        throw new RepositoryError(
          `Could not update entity. Could not find a entity with id ${id}.`
        );
      }

      return this.convertDocumentToEntity(document);
    });
  }

  public async updateByIds(
    ids: E["id"][],
    properties: EntityPropertiesPartial<E>
  ): Promise<E[]> {
    return this.executeRepositoryOperation(async () => {
      const mongoDocumentFilter = this.convertIdentifiersToDocumentFilter(ids);

      const propertiesToUpdate = {
        $set: this.resolvePropertiesToSet(properties),
        $unset: this.resolvePropertiesToUnset(properties),
      } as const;

      await this.collection.updateMany(mongoDocumentFilter, propertiesToUpdate);

      // TODO: Wrap collection calls into a transaction
      // TODO: Use find operation directly instead of calling getById
      return this.getByIds(ids);
    });
  }

  public async deleteById(id: E["id"]): Promise<void> {
    return this.executeRepositoryOperation(async () => {
      if (!this.validIdentifier(id)) {
        return;
      }

      const mongoFilter = this.convertIdentifierToDocumentFilter(id);
      await this.collection.deleteOne(mongoFilter);
    });
  }

  public async deleteByIds(ids: E["id"][]): Promise<void> {
    return this.executeRepositoryOperation(async () => {
      const validObjectIds = this.filterValidIdentifiers(ids);

      if (validObjectIds.length === 0) {
        return;
      }

      const mongoFilter = this.convertIdentifiersToDocumentFilter(ids);

      await this.collection.deleteMany(mongoFilter);
    });
  }

  public async deleteByFilter(filter: Filter<E>): Promise<void> {
    return this.executeRepositoryOperation(async () => {
      const mongoFilter = this.convertEntityFilterToDocumentFilter(filter);
      await this.collection.deleteMany(mongoFilter);
    });
  }

  public async getAll(): Promise<E[]> {
    return this.executeRepositoryOperation(async () => {
      const documents = await this.collection.find().toArray();
      return this.convertDocumentsToEntities(documents);
    });
  }

  public async getById(id: E["id"]): Promise<E | undefined> {
    return this.executeRepositoryOperation(async () => {
      if (!this.validIdentifier(id)) {
        return undefined;
      }

      const mongoFilter = this.convertIdentifierToDocumentFilter(id);
      const document = await this.collection.findOne(mongoFilter);

      if (!document) {
        return undefined;
      }

      return this.convertDocumentToEntity(document);
    });
  }

  public async getByIds(ids: E["id"][]): Promise<E[]> {
    return this.executeRepositoryOperation(async () => {
      const validIds = ids.filter(this.validIdentifier);

      if (validIds.length === 0) {
        return [];
      }

      const mongoFilter = this.convertIdentifiersToDocumentFilter(ids);

      const documents = await this.collection.find(mongoFilter).toArray();

      return this.convertDocumentsToEntities(documents);
    });
  }

  public async getByFilter(filter: Filter<E>): Promise<E[]> {
    const mongoFilter = this.convertEntityFilterToDocumentFilter(filter);
    const documents = await this.collection.find(mongoFilter).toArray();
    return this.convertDocumentsToEntities(documents);
  }

  public async countAll(): Promise<number> {
    return this.collection.countDocuments();
  }

  public async countByFilter(filter: Filter<E>): Promise<number> {
    const mongoFilter = this.convertEntityFilterToDocumentFilter(filter);
    return this.collection.countDocuments(mongoFilter);
  }

  public onEntityDeleted(callback: Callback<[E["id"]]>): void {
    this.eventEmitter.addListener("entityDeleted", callback);
  }

  public onEntityCreated(callback: Callback<[E]>): void {
    this.eventEmitter.addListener("entityCreated", callback);
  }

  public onEntityUpdated(callback: Callback<[E, E]>): void {
    this.eventEmitter.addListener("entityUpdated", callback);
  }

  private emitDeletedEntity(entityId: E["id"]): void {
    this.eventEmitter.emit("entityUpdated", entityId);
  }

  private emitCreatedEntity(entityId: E): void {
    this.eventEmitter.emit("entityCreated", entityId);
  }

  private emitUpdatedDocument(outdatedEntity: E, updatedEntity: E): void {
    this.eventEmitter.emit("entityDeleted", outdatedEntity, updatedEntity);
  }
}
