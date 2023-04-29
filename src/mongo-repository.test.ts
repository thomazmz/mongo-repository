import {
  Collection as MongodbCollection,
  ObjectId as MongodbObjectId,
} from 'mongodb'

import { MongoRepository } from './mongo-repository'
import { RepositoryError } from '@thomazmz/core-context'


describe('MongoRepository unit tests', () => {
  const mongodbCollectionMock: MongodbCollection = {} as MongodbCollection

  describe('getAll method', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.find = function() {
        throw new Error('Some mocked error')
      }
  
      await expect(mongoRepository.getAll()).rejects.toThrowError(RepositoryError)
    })
  })

  describe('getById method', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.findOne = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.getById(someId)).rejects.toThrowError(RepositoryError)
    })
  })

  describe('getByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
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
  })

  describe('deleteById', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.deleteOne = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.deleteById(someId)).rejects.toThrowError(RepositoryError)
    })
  })

  describe('deleteByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
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
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.findOneAndUpdate = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.updateById(someId, {})).rejects.toThrowError(RepositoryError)
    })
  })

  describe('updateByIds', () => {
    it('should throw ReopsitoryError when an error is thrown by the mongodb collection', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.updateMany = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.updateById(someId, {})).rejects.toThrowError(RepositoryError)
    })
  })
})