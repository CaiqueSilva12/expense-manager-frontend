'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import LoadingSpinner from '@/components/LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Transaction {
  _id: string;
  amount: number;
  type: 'expense' | 'revenue';
  category: string;
  date: string;
  description: string;
}

interface Category {
  _id: string;
  name: string;
  budget: number;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === selectedMonth && 
           transactionDate.getFullYear() === selectedYear;
  });

  const monthlyExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyRevenue = filteredTransactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dashboard: Starting data fetch...');
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        console.log('Dashboard: Retrieved from localStorage:', {
          hasToken: !!token,
          hasUserId: !!userId,
          userIdValue: userId
        });

        if (!token || !userId) {
          console.error('Dashboard: Missing credentials', {
            token: token ? 'Present' : 'Missing',
            userId: userId ? 'Present' : 'Missing'
          });
          router.push('/login');
          return;
        }

        // Validate userId format (should be a 24-character hex string)
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
          console.error('Dashboard: Invalid userId format', {
            userId,
            length: userId?.length,
            isHex: /^[0-9a-fA-F]+$/.test(userId || ''),
            expectedLength: 24
          });
          setError('Invalid user ID format. Please log in again.');
          return;
        }

        console.log('Dashboard: Making API requests...');
        console.log('Request details:', {
          userId,
          token: token ? 'Present' : 'Missing',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });

        const [transactionsRes, categoriesRes, userRes] = await Promise.all([
          fetch(`http://localhost:3001/api/transactions/${userId}?month=${String(new Date().getMonth() + 1)}&year=${String(new Date().getFullYear())}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`http://localhost:3001/api/categories/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`http://localhost:3001/api/users/id/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        console.log('API Responses:', {
          transactionsStatus: transactionsRes.status,
          categoriesStatus: categoriesRes.status,
          userStatus: userRes.status
        });

        // Check each response individually to provide better error messages
        if (!transactionsRes.ok) {
          const errorData = await transactionsRes.json().catch(() => ({}));
          console.error('Transactions API error:', {
            status: transactionsRes.status,
            statusText: transactionsRes.statusText,
            errorData,
          });
          throw new Error(`Failed to fetch transactions: ${transactionsRes.status} ${errorData.error || errorData.message || transactionsRes.statusText}`);
        }
        if (!categoriesRes.ok) {
          const errorData = await categoriesRes.json().catch(() => ({}));
          console.error('Categories API error:', {
            status: categoriesRes.status,
            statusText: categoriesRes.statusText,
            errorData,
          });
          throw new Error(`Failed to fetch categories: ${categoriesRes.status} ${errorData.message || categoriesRes.statusText}`);
        }
        if (!userRes.ok) {
          const errorData = await userRes.json().catch(() => ({}));
          console.error('User API error:', {
            status: userRes.status,
            statusText: userRes.statusText,
            errorData,
          });
          throw new Error(`Failed to fetch user data: ${userRes.status} ${errorData.message || userRes.statusText}`);
        }

        const [transactionsData, categoriesData, userData] = await Promise.all([
          transactionsRes.json(),
          categoriesRes.json(),
          userRes.json(),
        ]);

        // Ensure transactions is an array
        if (!Array.isArray(transactionsData)) {
          throw new Error('Invalid transactions data format');
        }

        // Ensure categories is an array
        if (!Array.isArray(categoriesData)) {
          throw new Error('Invalid categories data format');
        }

        // Ensure user data has the required properties
        if (typeof userData.balance !== 'number') {
          throw new Error('Invalid user data format');
        }

        setTransactions(transactionsData);
        setCategories(categoriesData);
        setBalance(userData.balance);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dados..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getExpenseDataByCategory = () => {
    const categoryExpenses = categories.map(category => {
      const expenses = transactions
        .filter(t => t.type === 'expense' && t.category === category.name)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        amount: expenses
      };
    });

    return {
      labels: categoryExpenses.map(item => item.name),
      datasets: [
        {
          data: categoryExpenses.map(item => item.amount),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',  // Indigo
            'rgba(236, 72, 153, 0.8)',  // Pink
            'rgba(16, 185, 129, 0.8)',  // Green
            'rgba(245, 158, 11, 0.8)',  // Amber
            'rgba(59, 130, 246, 0.8)',  // Blue
            'rgba(139, 92, 246, 0.8)',  // Purple
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(20, 184, 166, 0.8)',  // Teal
            'rgba(249, 115, 22, 0.8)',  // Orange
            'rgba(168, 85, 247, 0.8)',  // Violet
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBackgroundColor: [
            'rgba(99, 102, 241, 1)',   // Indigo
            'rgba(236, 72, 153, 1)',   // Pink
            'rgba(16, 185, 129, 1)',   // Green
            'rgba(245, 158, 11, 1)',   // Amber
            'rgba(59, 130, 246, 1)',   // Blue
            'rgba(139, 92, 246, 1)',   // Purple
            'rgba(239, 68, 68, 1)',    // Red
            'rgba(20, 184, 166, 1)',   // Teal
            'rgba(249, 115, 22, 1)',   // Orange
            'rgba(168, 85, 247, 1)',   // Violet
          ],
        },
      ],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Gerenciador de Despesas
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/transactions"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-200 shadow-sm"
              >
                Adicionar Transação
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center mb-8">
            <div className="flex space-x-4 bg-white/50 backdrop-blur-sm rounded-lg border-2 border-gray-200 p-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              >
                {months.map((month, index) => (
                  <option key={month} value={index} className="text-black">
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              >
                {years.map((year) => (
                  <option key={year} value={year} className="text-black">
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Saldo</dt>
                      <dd className="text-lg font-medium text-gray-900">R$ {balance.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-full bg-gradient-to-r from-red-100 to-pink-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Despesas Mensais</dt>
                      <dd className="text-lg font-medium text-red-600">R$ {monthlyExpenses.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Receitas Mensais</dt>
                      <dd className="text-lg font-medium text-green-600">R$ {monthlyRevenue.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Despesas por Categoria</h2>
              <div className="h-80 flex items-center justify-center">
                <Pie data={getExpenseDataByCategory()} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        font: {
                          size: 12,
                          family: 'Inter, sans-serif'
                        },
                        padding: 20
                      }
                    },
                  },
                }} />
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-lg border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Transações Recentes</h2>
              </div>
              <div className="h-[400px] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-lg border-2 border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'expense'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {transaction.type === 'expense' ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.category && `${transaction.category} • `}
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {transaction.type === 'expense' ? '-' : '+'}R$ {transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Categorias</h2>
              <Link
                href="/categories"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-200 shadow-sm"
              >
                Gerenciar Categorias
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const categoryExpenses = transactions
                  .filter((t) => t.type === 'expense' && t.category === category.name)
                  .reduce((sum, t) => sum + t.amount, 0);
                const percentage = (categoryExpenses / category.budget) * 100;

                return (
                  <div key={category._id} className="bg-white/80 backdrop-blur-md overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Gasto: R$ {categoryExpenses.toFixed(2)}</span>
                          <span>Orçamento: R$ {category.budget.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              percentage > 100 ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-purple-600 to-blue-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 