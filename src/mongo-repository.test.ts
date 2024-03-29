import {
  Db,
  Collection as MongodbCollection,
  ObjectId as MongodbObjectId,
} from 'mongodb'

import { MongoRepository } from './mongo-repository'
import { RepositoryError } from '@thomazmz/core-context'


describe('MongoRepository unit tests', () => {
  const mongodbCollectionMockName = 'someCollectionName'

  const mongodbCollectionMock = {} as MongodbCollection

  const mongodbMock = { collection() { return mongodbCollectionMock } } as unknown as Db

  describe('getAll method', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.find = function() {
        throw new Error('Some mocked error')
      }
  
      await expect(mongoRepository.getAll()).rejects.toThrowError(RepositoryError)
    })
  })

  describe('getById method', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.findOne = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.getById(someId)).rejects.toThrowError(RepositoryError)
    })

    it('should return undefined when an invalid id is passed', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)

      const someInvalidId = 'someInvalidId'

      const result = await mongoRepository.getById(someInvalidId)
  
      expect(result).toEqual(undefined)
    })
  })

  describe('getByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.find = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
      const anotherId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.getByIds([
        someId,
        anotherId,
      ])).rejects.toThrowError(RepositoryError)
    })

    it('should return empty array when no valid ids are passed', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)

      const someInvalidId = 'someInvalidId'
      const anotherInvalidId = 'anotherInvalidId'

      const result = await mongoRepository.getByIds([
        someInvalidId,
        anotherInvalidId,
      ])
  
      expect(result).toEqual([])
    })
  })

  describe('deleteById', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.deleteOne = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.deleteById(someId)).rejects.toThrowError(RepositoryError)
    })
  })

  describe('deleteByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.deleteMany = function() {
        throw new Error('Some mocked error')
      } 

      const someId = (new MongodbObjectId()).toString()
      const anotherId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.deleteByIds([
        someId,
        anotherId,
      ])).rejects.toThrowError(RepositoryError)
    })
  })

  describe('updateById', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.findOneAndUpdate = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.updateById(someId, {})).rejects.toThrowError(RepositoryError)
    })
  })

  describe('updateByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.updateMany = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.updateById(someId, {})).rejects.toThrowError(RepositoryError)
    })
  })

  describe('createOne', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.insertOne = function() {
        throw new Error('Some mocked error')
      }
  
      await expect(mongoRepository.createOne({})).rejects.toThrowError(RepositoryError)
    })
  })

  describe('createMany', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
      
      mongodbCollectionMock.insertOne = function() {
        throw new Error('Some mocked error')
      }
  
      await expect(mongoRepository.createMany([{}])).rejects.toThrowError(RepositoryError)
    })
  })

  it('should return empty array when empty array is passed', async () => {
    const mongoRepository = new MongoRepository(mongodbMock, mongodbCollectionMockName)
    const result = await mongoRepository.createMany([])
    expect(result).toEqual([])
  })
})
