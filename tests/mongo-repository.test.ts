import { EntityProperties } from '@thomazmz/core-context'
import { MongoTestContext } from './mongo-repository-test-context'
import { MongoTestEntity } from './mongo-repository-test-entity'
import { MongoRepository } from '../src/mongo-repository'

describe('MongoRepository', () => {
  const mongoTestContext = new MongoTestContext()
  
  const mongoRepository = new MongoRepository<MongoTestEntity>(mongoTestContext.collection)

  beforeAll(async () => {
    await mongoTestContext.openConnection()
  })

  afterEach(async () => {
    await mongoTestContext.resetTestCollection()
  })

  afterAll(async () => {
    await mongoTestContext.closeConnection()
  })

  async function seedTestCollection(properties: EntityProperties<MongoTestEntity>[] = []) {
    const currentDate = new Date()
    await mongoTestContext.seedTestCollectionDocuments([ ...properties,
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'AAA',
        numberProperty: 123,
        dateProperty: new Date(10),
        booleanProperty: true,
      },
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'AAA',
        numberProperty: 234,
        dateProperty: new Date(20),
        booleanProperty: false,
      },
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'BBB',
        numberProperty: 234,
        dateProperty: new Date(30),
        booleanProperty: true,
      },
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'CCC',
        numberProperty: 345,
        dateProperty: new Date(30),
        booleanProperty: false,
      },
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'EEE',
        numberProperty: 456,
        dateProperty: new Date(40),
        booleanProperty: true,
      },
      {
        createdAt: currentDate,
        updatedAt: currentDate,
        stringProperty: 'FFF',
        numberProperty: 567,
        dateProperty: new Date(50),
        booleanProperty: false,
      },
    ])
  }

  describe('getAll', () => {
    it('should return all entities', async () => {
      await seedTestCollection()

      const result = await mongoRepository.getAll()
      
      expect(result.length).toBe(6)

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          stringProperty: 'AAA',
          numberProperty: 123,
          dateProperty: new Date(10),
          booleanProperty: true,
        }),
        expect.objectContaining({
          stringProperty: 'AAA',
          numberProperty: 234,
          dateProperty: new Date(20),
          booleanProperty: false,
        }),
        expect.objectContaining({
          stringProperty: 'BBB',
          numberProperty: 234,
          dateProperty: new Date(30),
          booleanProperty: true,
        }),
        expect.objectContaining({
          stringProperty: 'CCC',
          numberProperty: 345,
          dateProperty: new Date(30),
          booleanProperty: false,
        }),
        expect.objectContaining({
          stringProperty: 'EEE',
          numberProperty: 456,
          dateProperty: new Date(40),
          booleanProperty: true,
        }),
        expect.objectContaining({
          stringProperty: 'FFF',
          numberProperty: 567,
          dateProperty: new Date(50),
          booleanProperty: false,
        }),
      ]))
    })
  })
})