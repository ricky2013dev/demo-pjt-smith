// Shared transaction types and utilities
export type TransactionType = 'FETCH' | 'ANALYSIS' | 'API' | 'CALL' | 'SAVE';

export interface TransactionTypeConfig {
  type: TransactionType;
  bgColor: string;
  textColor: string;
}

export const TRANSACTION_TYPE_STYLES: Record<TransactionType, TransactionTypeConfig> = {
  FETCH: {
    type: 'FETCH',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
    textColor: 'text-indigo-600 dark:text-indigo-400'
  },
  ANALYSIS: {
    type: 'ANALYSIS',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600 dark:text-cyan-400'
  },
  API: {
    type: 'API',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  CALL: {
    type: 'CALL',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  SAVE: {
    type: 'SAVE',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400'
  }
};

export const getTransactionTypeStyle = (type: TransactionType): TransactionTypeConfig => {
  return TRANSACTION_TYPE_STYLES[type] || TRANSACTION_TYPE_STYLES.API;
};

export const getTransactionTypeColor = (type: TransactionType): string => {
  return getTransactionTypeStyle(type).textColor;
};

export const getTransactionTypeBgColor = (type: TransactionType): string => {
  return getTransactionTypeStyle(type).bgColor;
};
