import {
  Collection as MongodbCollection,
  ObjectId as MongodbObjectId,
} from 'mongodb'

import { 
  MongoRepository
} from './mongo-repository'

import {
  RepositoryError
} from '@thomazmz/core-context'


describe('MongoRepository unit tests', () => {
  const mongodbCollectionMock: MongodbCollection = {} as MongodbCollection

  describe('getAll method', () => {
    it('should throw RepositoryError an error is internally thrown', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.find = function() {
        throw new Error('Some mocked error')
      }
  
      await expect(mongoRepository.getAll()).rejects.toThrowError(RepositoryError)
    })
  })

  describe('getById method', () => {
    it('should throw RepositoryError an error is internally thrown', async () => {
      const mongoRepository = new MongoRepository(mongodbCollectionMock)
      
      mongodbCollectionMock.find = function() {
        throw new Error('Some mocked error')
      }

      const someId = (new MongodbObjectId()).toString()
  
      await expect(mongoRepository.getById(someId)).rejects.toThrowError(RepositoryError)
    })
  })
})