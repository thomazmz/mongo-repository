import { 
  MongoClient,
  Document as MongoDocument,
  Collection as MongoCollection,
  Db  as MongoDatabase,

} from 'mongodb'

export class MongoTestContext {

  public readonly client: MongoClient
  public readonly database: MongoDatabase
  public readonly collection: MongoCollection

  constructor(
    public readonly testCollectionName: string = 'test-collection',
    public readonly testDatabaseName: string = 'test-database',
    public readonly connectionString: string = 'mongodb://admin:admin@localhost:27017',
  ) {
    this.client = new MongoClient(connectionString)
    this.database = this.client.db(testDatabaseName)
    this.collection = this.database.collection(testCollectionName)
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
  async fetchTestCollectionDocuments(): Promise<MongoDocument[]> {
    return this.collection.find().toArray()
  }
}
