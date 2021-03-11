/* eslint-disable prettier/prettier */
import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository'
import Transaction from '../models/Transaction'
import Category from '../models/Category'

import AppError from '../errors/AppError'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category: string
}

class CreateTransactionService {
  public async execute({ title, value, type, category}: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    const categoryRepository = getRepository(Category)

    const balance = await transactionsRepository.getBalance()

    if(type === 'outcome') {
      const isValidTransaction = value <= balance.total;

      if(!isValidTransaction) {
        throw new AppError('Not enough balance for this action.');
      }
    }

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category
      }
    })

    if(!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category
      })

      await categoryRepository.save(transactionCategory)
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory
    })

    await transactionsRepository.save(transaction)

    return transaction
    }
  }

export default CreateTransactionService;

