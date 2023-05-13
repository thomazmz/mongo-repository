import {
  ObjectId as MongodbObjectId
} from 'mongodb'

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

  describe('getAll method', () => {
    it('should return all entities', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()

      expect(entities.length).toBe(6)

      expect(entities).toEqual(expect.arrayContaining([
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

  describe('getById', () => {
    it('should return entities by id', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()

      for (const entity of entities) {
        const foundEntity = await mongoRepository.getById(entity.id)
        expect(foundEntity).toEqual(entity)
      }
    })

    it('should return undefined when the given id is invalid', async () => {
      await seedTestCollection()

      const entity = await mongoRepository.getById('some-invalid-entity-id')

      expect(entity).toEqual(undefined)
    })

    it('should return undefined when there is not an entity with the given id', async () => {
      await seedTestCollection()

      const unexistentEntityId = new MongodbObjectId()

      const entity = await mongoRepository.getById(unexistentEntityId.toString())

      expect(entity).toBe(undefined)
    })
  })

  describe('getByIds', () => {
    it('should return empty array if all given ids are invalid', async () => {
      await seedTestCollection()

      const foundEntities = await mongoRepository.getByIds([
        'some-invalid-object-id',
        'another-invalid-object-id',
      ])

      expect(foundEntities).toEqual([])
    })

    it('should return array with entities that match give ids', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const firstEntityId = entities[0].id
      const secondEntityId = entities[1].id

      const foundEntities = await mongoRepository.getByIds([
        firstEntityId,
        secondEntityId,
      ])

      expect(foundEntities).toEqual(expect.arrayContaining([
        entities[0],
        entities[1],
      ]))
    })
  })

  describe('deleteById', () => {
    it('should delete element by id', async () => {
      await seedTestCollection()
      const entities = await mongoRepository.getAll()

      for (const entity of entities) {
        await mongoRepository.deleteById(entity.id)
        const remainingEntities = await mongoRepository.getAll()

        expect(remainingEntities.every((remainingEntity) => {
          return remainingEntity.id !==  entity.id
        })).toEqual(true)
      }
    })

    it('should accept an invalid id without throwing an error', async () => {
      await seedTestCollection()

      const entity = await mongoRepository.deleteById('some-invalid-entity-id')

      expect(entity).toEqual(undefined)
    })

    it('should accept an unmatching id without throwing an error', async () => {
      await seedTestCollection()

      const unexistentEntityId = new MongodbObjectId()

      const entity = await mongoRepository.deleteById(unexistentEntityId.toString())

      expect(entity).toBe(undefined)
    })
  })

  describe('deleteByIds', () => {
    it('should accept an invalid ids without throwing an error', async () => {
      await seedTestCollection()

      const entity = await mongoRepository.deleteByIds([
        'another-invalid-entity-id',
        'some-invalid-entity-id',
      ])

      expect(entity).toEqual(undefined)
    })

    it('should delete elements by ids', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const firstEntityId = entities[0].id
      const secondEntityId = entities[1].id

      await mongoRepository.deleteByIds([
        firstEntityId,
        secondEntityId,
      ])

      const remainingEntities = await mongoRepository.getAll()

      expect(remainingEntities.every(({ id }) => {
        return id !==  firstEntityId && id !== secondEntityId
      })).toEqual(true)
    })
  })

  describe('updateById', () => {

    it('should update entity', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntityId = entities[0].id

      await mongoRepository.updateById(someEntityId, {
        stringProperty: 'ABC',
        numberProperty: 321,
        dateProperty: new Date(1000),
        booleanProperty: false,
      })

      const updatedEntity = await mongoRepository.getById(someEntityId)

      expect(updatedEntity?.id).toEqual(someEntityId,)
      expect(updatedEntity?.stringProperty).toEqual('ABC')
      expect(updatedEntity?.numberProperty).toEqual(321)
      expect(updatedEntity?.dateProperty).toEqual(new Date(1000))
      expect(updatedEntity?.booleanProperty).toEqual(false)
    })

    it('should return updated entity', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntityId = entities[0].id

      const updatedEntity = await mongoRepository.updateById(someEntityId, {
        stringProperty: 'ABC',
        numberProperty: 321,
        dateProperty: new Date(1000),
        booleanProperty: false,
      })

      expect(updatedEntity.id).toEqual(someEntityId,)
      expect(updatedEntity.stringProperty).toEqual('ABC')
      expect(updatedEntity.numberProperty).toEqual(321)
      expect(updatedEntity.dateProperty).toEqual(new Date(1000))
      expect(updatedEntity.booleanProperty).toEqual(false)
    })

    it('should partially update entity', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntity = entities[0]
      const someEntityId = someEntity.id

      const updatedEntity = await mongoRepository.updateById(someEntityId, {
        stringProperty: 'ABC',
        numberProperty: 321,
      })

      expect(updatedEntity.id).toEqual(someEntityId,)
      expect(updatedEntity.stringProperty).toEqual('ABC')
      expect(updatedEntity.numberProperty).toEqual(321)
      expect(updatedEntity.dateProperty).toEqual(someEntity.dateProperty)
      expect(updatedEntity.booleanProperty).toEqual(someEntity.booleanProperty)
    })

    it('should unset entity properties', async () => {
      await mongoTestContext.seedTestCollectionDocuments([{
        stringProperty: 'AAA',
        numberProperty: 123,
        dateProperty: new Date(10),
        booleanProperty: true,
        optionalStringProperty: 'BBB',
        optionalNumberProperty: 456,
        optionalDateProperty: new Date(20),
        optionalBooleanProperty: false,
      }])

      const entityCount = await mongoRepository.countAll()
      
      expect(entityCount).toBe(1)

      const [ someEntity ] = await mongoRepository.getAll()
      
      expect(someEntity.stringProperty).toEqual('AAA')
      expect(someEntity.numberProperty).toEqual(123)
      expect(someEntity.dateProperty).toEqual(new Date(10))
      expect(someEntity.booleanProperty).toEqual(true)
      expect(someEntity.optionalStringProperty).toEqual('BBB')
      expect(someEntity.optionalNumberProperty).toEqual(456)
      expect(someEntity.optionalDateProperty).toEqual(new Date(20))
      expect(someEntity.optionalBooleanProperty).toEqual(false)

      const updateEntityResult = await mongoRepository.updateById(someEntity.id, {
        optionalStringProperty: undefined,
        optionalNumberProperty: undefined,
        optionalDateProperty: undefined,
        optionalBooleanProperty: undefined,
      })

      expect(updateEntityResult.id).toEqual(someEntity.id)
      expect(updateEntityResult.stringProperty).toEqual(someEntity.stringProperty)
      expect(updateEntityResult.numberProperty).toEqual(someEntity.numberProperty)
      expect(updateEntityResult.dateProperty).toEqual(someEntity.dateProperty)
      expect(updateEntityResult.booleanProperty).toEqual(someEntity.booleanProperty)
      expect("optionalStringProperty" in updateEntityResult).toBe(false)
      expect("optionalNumberProperty" in updateEntityResult).toBe(false)
      expect("optionalDateProperty" in updateEntityResult).toBe(false)
      expect("optionalBooleanProperty" in updateEntityResult).toBe(false)

      const updatedEntity = await mongoRepository.getById(someEntity.id)

      expect(updatedEntity).toBeDefined()
      expect(updatedEntity?.id).toEqual(someEntity.id)
      expect(updatedEntity?.stringProperty).toEqual(someEntity.stringProperty)
      expect(updatedEntity?.numberProperty).toEqual(someEntity.numberProperty)
      expect(updatedEntity?.dateProperty).toEqual(someEntity.dateProperty)
      expect(updatedEntity?.booleanProperty).toEqual(someEntity.booleanProperty)
      expect(updatedEntity && "optionalStringProperty" in updatedEntity).toBe(false)
      expect(updatedEntity && "optionalNumberProperty" in updatedEntity).toBe(false)
      expect(updatedEntity && "optionalDateProperty" in updatedEntity).toBe(false)
      expect(updatedEntity && "optionalBooleanProperty" in updatedEntity).toBe(false)
    })
  })

  describe('updateByIds', () => {

    it('should update entities', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntityId = entities[0].id
      const anotherEntityId = entities[1].id

      await mongoRepository.updateByIds([
        someEntityId,
        anotherEntityId,
      ], {
        stringProperty: 'ABC',
        numberProperty: 321,
        dateProperty: new Date(1000),
        booleanProperty: false,
      })

      const updatedEntities = await mongoRepository.getByIds([
        someEntityId,
        anotherEntityId,
      ])

      const someUpdatedEntity = updatedEntities.find(e => e.id === someEntityId)

      expect(someUpdatedEntity?.id).toEqual(someEntityId)
      expect(someUpdatedEntity?.stringProperty).toEqual('ABC')
      expect(someUpdatedEntity?.numberProperty).toEqual(321)
      expect(someUpdatedEntity?.dateProperty).toEqual(new Date(1000))
      expect(someUpdatedEntity?.booleanProperty).toEqual(false)

      const anotherUpdatedEntity = updatedEntities.find(e => e.id === anotherEntityId)

      expect(anotherUpdatedEntity?.id).toEqual(anotherEntityId)
      expect(anotherUpdatedEntity?.stringProperty).toEqual('ABC')
      expect(anotherUpdatedEntity?.numberProperty).toEqual(321)
      expect(anotherUpdatedEntity?.dateProperty).toEqual(new Date(1000))
      expect(anotherUpdatedEntity?.booleanProperty).toEqual(false)
    })

    it('should return updated entities', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntityId = entities[0].id
      const anotherEntityId = entities[1].id

      const updatedEntities = await mongoRepository.updateByIds([
        someEntityId,
        anotherEntityId,
      ], {
        stringProperty: 'ABC',
        numberProperty: 321,
        dateProperty: new Date(1000),
        booleanProperty: false,
      })

      expect(updatedEntities[0].id).toEqual(someEntityId,)
      expect(updatedEntities[0].stringProperty).toEqual('ABC')
      expect(updatedEntities[0].numberProperty).toEqual(321)
      expect(updatedEntities[0].dateProperty).toEqual(new Date(1000))
      expect(updatedEntities[0].booleanProperty).toEqual(false)

      expect(updatedEntities[1].id).toEqual(anotherEntityId)
      expect(updatedEntities[1].stringProperty).toEqual('ABC')
      expect(updatedEntities[1].numberProperty).toEqual(321)
      expect(updatedEntities[1].dateProperty).toEqual(new Date(1000))
      expect(updatedEntities[1].booleanProperty).toEqual(false)
    })

    it('should partially update entities', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const someEntityId = entities[0].id
      const anotherEntityId = entities[1].id

      await mongoRepository.updateByIds([
        someEntityId,
        anotherEntityId,
      ], {
        stringProperty: 'ABC',
        numberProperty: 321,
      })

      const someUpdatedEntity = await mongoRepository.getById(someEntityId)
      const anotherUpdatedEntity = await mongoRepository.getById(anotherEntityId)

      expect(someUpdatedEntity?.id).toEqual(someEntityId)
      expect(someUpdatedEntity?.stringProperty).toEqual('ABC')
      expect(someUpdatedEntity?.numberProperty).toEqual(321)
      expect(someUpdatedEntity?.dateProperty).toEqual(entities[0]?.dateProperty)
      expect(someUpdatedEntity?.booleanProperty).toEqual(entities[0]?.booleanProperty)

      expect(anotherUpdatedEntity?.id).toEqual(anotherEntityId)
      expect(anotherUpdatedEntity?.stringProperty).toEqual('ABC')
      expect(anotherUpdatedEntity?.numberProperty).toEqual(321)
      expect(anotherUpdatedEntity?.dateProperty).toEqual(entities[1]?.dateProperty)
      expect(anotherUpdatedEntity?.booleanProperty).toEqual(entities[1]?.booleanProperty)
    })

    it('should unset properties from many entities', async () => {
      await mongoTestContext.seedTestCollectionDocuments([
        {
          stringProperty: 'AAA',
          numberProperty: 12,
          dateProperty: new Date(10),
          booleanProperty: true,
          optionalStringProperty: 'BBB',
          optionalNumberProperty: 34,
          optionalDateProperty: new Date(20),
          optionalBooleanProperty: false,
        },
        {
          stringProperty: 'AAA',
          numberProperty: 12,
          dateProperty: new Date(10),
          booleanProperty: true,
          optionalStringProperty: 'BBB',
          optionalNumberProperty: 34,
          optionalDateProperty: new Date(20),
          optionalBooleanProperty: false,
        }
      ])

      const entityCount = await mongoRepository.countAll()
      
      expect(entityCount).toBe(2)

      const [ someEntity, anotherEntity ] = await mongoRepository.getAll()

      expect(someEntity.stringProperty).toEqual('AAA')
      expect(someEntity.numberProperty).toEqual(12)
      expect(someEntity.dateProperty).toEqual(new Date(10))
      expect(someEntity.booleanProperty).toEqual(true)
      expect(someEntity.optionalStringProperty).toEqual('BBB')
      expect(someEntity.optionalNumberProperty).toEqual(34)
      expect(someEntity.optionalDateProperty).toEqual(new Date(20))
      expect(someEntity.optionalBooleanProperty).toEqual(false)

      expect(anotherEntity.stringProperty).toEqual('AAA')
      expect(anotherEntity.numberProperty).toEqual(12)
      expect(anotherEntity.dateProperty).toEqual(new Date(10))
      expect(anotherEntity.booleanProperty).toEqual(true)
      expect(anotherEntity.optionalStringProperty).toEqual('BBB')
      expect(anotherEntity.optionalNumberProperty).toEqual(34)
      expect(anotherEntity.optionalDateProperty).toEqual(new Date(20))
      expect(anotherEntity.optionalBooleanProperty).toEqual(false)

      const [ 
        someEntityUpdateResult, 
        anotherEntityUpdateResult
      ] = await mongoRepository.updateByIds([
        someEntity.id, 
        anotherEntity.id,
      ], {
        optionalStringProperty: undefined,
        optionalNumberProperty: undefined,
        optionalDateProperty: undefined,
        optionalBooleanProperty: undefined,
      })

      expect(someEntityUpdateResult?.stringProperty).toEqual('AAA')
      expect(someEntityUpdateResult?.numberProperty).toEqual(12)
      expect(someEntityUpdateResult?.dateProperty).toEqual(new Date(10))
      expect(someEntityUpdateResult?.booleanProperty).toEqual(true)

      expect(someEntityUpdateResult && "optionalStringProperty" in someEntityUpdateResult).toBe(false)
      expect(someEntityUpdateResult && "optionalNumberProperty" in someEntityUpdateResult).toBe(false)
      expect(someEntityUpdateResult && "optionalDateProperty" in someEntityUpdateResult).toBe(false)
      expect(someEntityUpdateResult && "optionalBooleanProperty" in someEntityUpdateResult).toBe(false)

      expect(anotherEntityUpdateResult?.stringProperty).toEqual('AAA')
      expect(anotherEntityUpdateResult?.numberProperty).toEqual(12)
      expect(anotherEntityUpdateResult?.dateProperty).toEqual(new Date(10))
      expect(anotherEntityUpdateResult?.booleanProperty).toEqual(true)

      expect(anotherEntityUpdateResult && "optionalStringProperty" in anotherEntityUpdateResult).toBe(false)
      expect(anotherEntityUpdateResult && "optionalNumberProperty" in anotherEntityUpdateResult).toBe(false)
      expect(anotherEntityUpdateResult && "optionalDateProperty" in anotherEntityUpdateResult).toBe(false)
      expect(anotherEntityUpdateResult && "optionalBooleanProperty" in anotherEntityUpdateResult).toBe(false)


      const [
        someUpdatedEntity,
        anotherUpdatedEntity 
      ] = await mongoRepository.getAll()

      expect(someUpdatedEntity?.stringProperty).toEqual('AAA')
      expect(someUpdatedEntity?.numberProperty).toEqual(12)
      expect(someUpdatedEntity?.dateProperty).toEqual(new Date(10))
      expect(someUpdatedEntity?.booleanProperty).toEqual(true)

      expect(someUpdatedEntity && "optionalStringProperty" in someUpdatedEntity).toBe(false)
      expect(someUpdatedEntity && "optionalNumberProperty" in someUpdatedEntity).toBe(false)
      expect(someUpdatedEntity && "optionalDateProperty" in someUpdatedEntity).toBe(false)
      expect(someUpdatedEntity && "optionalBooleanProperty" in someUpdatedEntity).toBe(false)

      expect(anotherUpdatedEntity?.stringProperty).toEqual('AAA')
      expect(anotherUpdatedEntity?.numberProperty).toEqual(12)
      expect(anotherUpdatedEntity?.dateProperty).toEqual(new Date(10))
      expect(anotherUpdatedEntity?.booleanProperty).toEqual(true)

      expect(anotherUpdatedEntity && "optionalStringProperty" in anotherUpdatedEntity).toBe(false)
      expect(anotherUpdatedEntity && "optionalNumberProperty" in anotherUpdatedEntity).toBe(false)
      expect(anotherUpdatedEntity && "optionalDateProperty" in anotherUpdatedEntity).toBe(false)
      expect(anotherUpdatedEntity && "optionalBooleanProperty" in anotherUpdatedEntity).toBe(false)
    })
  })

  describe('createOne', () => {
    it('It should create one entity', async () => {
      const entityProperties: EntityProperties<MongoTestEntity> = {
        numberProperty:  1,
        dateProperty: new Date(),
        stringProperty:  'someString',
        booleanProperty: true,
      }

      const createdEntity = await mongoRepository.createOne(entityProperties)

      const foundEntity = await mongoRepository.getById(createdEntity.id)

      expect(foundEntity).toEqual(createdEntity)
    })
  })

  describe('createMany', () => {
    it('It should create many entities', async () => {
      const someEntityProperties: EntityProperties<MongoTestEntity> = {
        numberProperty:  1,
        dateProperty: new Date(0),
        stringProperty:  'someString',
        booleanProperty: true,
      }

      const anotherEntityProperties: EntityProperties<MongoTestEntity> = {
        numberProperty:  2,
        dateProperty: new Date(1),
        stringProperty:  'anotherString',
        booleanProperty: false,
      }

      const createdEntities = await mongoRepository.createMany([
        someEntityProperties, 
        anotherEntityProperties,
      ])

      const foundEntities = await mongoRepository.getByIds(createdEntities.map(entity => entity.id))

      expect(foundEntities).toEqual(expect.arrayContaining(createdEntities))
    })
  })

  describe('countAll', () => {
    it('should count all entities', async () => {
      await seedTestCollection()

      const entities = await mongoRepository.getAll()
      const count = await mongoRepository.countAll()

      expect(entities.length).toBe(count)
    })
  })
})
