import csvParse from 'csv-parse';
import fs from 'fs';
import CreateTransactionService from './CreateTransactionService';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Response {
  transactions: CSVTransaction[];
  categories: string[];
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Response> {
    const contactReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCsv = contactReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || !type) return;

      categories.push(category);
      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    for await (const transaction of transactions) {
      const createTransactionService = new CreateTransactionService();
      await createTransactionService.execute(transaction);
    }
    return { categories, transactions };
  }
}

export default ImportTransactionsService;
