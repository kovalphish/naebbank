
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'Shopping' | 'Food' | 'Transfer' | 'Service';
}

export interface Card {
  id: string;
  type: 'Visa' | 'Mastercard';
  number: string;
  balance: number;
  color: string;
}

export type Screen = 'home' | 'cards' | 'transfer' | 'assistant' | 'profile' | 'qr' | 'payment';
