'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  _id: string;
  name: string;
  budget: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', budget: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          router.push('/login');
          return;
        }

        const response = await fetch(`http://localhost:3001/api/categories/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setError('Erro ao carregar categorias');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [router]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory.name,
          budget: parseFloat(newCategory.budget),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      const data = await response.json();
      setCategories([...categories, data]);
      setNewCategory({ name: '', budget: '' });
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      setError('Erro ao adicionar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (categoryId: string, newBudget: number) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budget: newBudget,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update budget');
      }

      setCategories(
        categories.map((category) =>
          category._id === categoryId ? { ...category, budget: newBudget } : category
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      setError('Erro ao atualizar orçamento');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando categorias..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Adicionar Categoria
            </h2>
          </div>
          <form onSubmit={handleAddCategory} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                Orçamento
              </label>
              <input
                type="number"
                id="budget"
                value={newCategory.budget}
                onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                step="0.01"
                min="0"
                className="mt-1 block w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" text="Adicionando..." />
                ) : (
                  'Adicionar Categoria'
                )}
              </button>
            </div>
          </form>
        </div>

        {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Suas Categorias</h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-lg border-2 border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative rounded-lg shadow-sm w-full">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={category.budget}
                      onBlur={(e) => handleUpdateBudget(category._id, parseFloat(e.target.value))}
                      className="block w-full pl-7 pr-12 py-2.5 border-2 border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-black"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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