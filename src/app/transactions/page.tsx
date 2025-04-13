'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
}

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'revenue'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/categories/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setCategory(data[0].name); // Set the first category name as default
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (type === 'expense' && !category) {
        setError('Category is required for expenses');
        return;
      }

      const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category: type === 'expense' ? category : undefined,
          description,
          date: new Date(date),
          user: userId,
          month: new Date(date).getMonth() + 1,
          year: new Date(date).getFullYear(),
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      setError('Erro ao criar transação');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Nova Transação
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'expense' | 'revenue');
                  if (e.target.value === 'revenue') {
                    setCategory('');
                  }
                }}
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
              >
                <option value="expense">Despesa</option>
                <option value="revenue">Receita</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Valor
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
              />
            </div>

            {type === 'expense' && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Data
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Adicionar Transação
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
} 