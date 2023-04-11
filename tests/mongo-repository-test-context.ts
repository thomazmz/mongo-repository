import { 
  MongoClient,
  Collection as MongoCollection,
  Db  as MongoDatabase,
} from 'mongodb'

export class MongoTestContext {

  public readonly client: MongoClient
  public readonly database: MongoDatabase
  public readonly collection: MongoCollection

  constructor(
    testCollection: string = 'test-collection',
    testDatabase: string = 'test-database',
    connectionString: string = 'mongodb://admin:admin@localhost:27017',
  ) {
    this.client = new MongoClient(connectionString)
    this.database = this.client.db(testDatabase)
    this.collection = this.database.collection(testCollection)
  }

  async openConnection(): Promise<void> {
    await this.client.connect()
  }
  async closeConnection(): Promise<void> {
    await this.client.close()
  }
  async resetTestCollection(): Promise<void> {
    await this.collection.deleteMany()
  }
  async seedTestCollectionDocuments(entities: any[]) {
    return this.collection.insertMany(entities)
  }
  async fetchTestCollectionDocuments(): Promise<any[]> {
    return this.collection.find().toArray()
  }
}
