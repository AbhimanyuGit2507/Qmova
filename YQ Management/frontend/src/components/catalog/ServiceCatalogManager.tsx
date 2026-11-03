import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Upload,
  ShoppingBag,
  X,
  Loader2,
  Search,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';

interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number; // in cents
  currency: string;
  imageUrl?: string;
  maxQty: number;
  isAvailable: boolean;
  sortOrder: number;
}

interface ServiceCatalogManagerProps {
  serviceId?: string;
  currency?: string;
}

export function ServiceCatalogManager({
  serviceId,
  currency = 'ZAR',
}: ServiceCatalogManagerProps) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemMaxQty, setNewItemMaxQty] = useState('5');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['service-catalog', serviceId],
    queryFn: () =>
      serviceId
        ? fetchApi(`/service-catalog/by-service/${serviceId}`)
        : null,
    enabled: !!serviceId,
  });

  const addItemMutation = useMutation({
    mutationFn: (data: AnyFixMe) =>
      fetchApi(`/service-catalog/${catalog.id}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', serviceId] });
      toast.success('Item added to catalog');
      setIsAddingItem(false);
      setNewItemName('');
      setNewItemDescription('');
      setNewItemPrice('');
      setNewItemImageUrl('');
    },
    onError: (err: AnyFixMe) =>
      toast.error(err?.message || 'Failed to add item to catalog'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: AnyFixMe }) =>
      fetchApi(`/service-catalog/${catalog.id}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', serviceId] });
    },
    onError: (err: AnyFixMe) =>
      toast.error(err?.message || 'Failed to update item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      fetchApi(`/service-catalog/${catalog.id}/items/${itemId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', serviceId] });
      toast.success('Item deleted');
    },
    onError: (err: AnyFixMe) =>
      toast.error(err?.message || 'Failed to delete item'),
  });

  const importItemsMutation = useMutation({
    mutationFn: (items: AnyFixMe[]) =>
      fetchApi(`/service-catalog/${catalog.id}/import`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: (res: AnyFixMe) => {
      queryClient.invalidateQueries({ queryKey: ['service-catalog', serviceId] });
      toast.success(`Successfully imported ${res?.importedCount || 0} items!`);
      setIsImportModalOpen(false);
      setCsvText('');
    },
    onError: (err: AnyFixMe) =>
      toast.error(err?.message || 'Import failed'),
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !catalog?.id) return;
    const priceInCents = Math.round(parseFloat(newItemPrice || '0') * 100);

    addItemMutation.mutate({
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      category: newItemCategory.trim() || 'General',
      unitPrice: priceInCents,
      currency: currency || catalog.currency || 'ZAR',
      maxQty: parseInt(newItemMaxQty, 10) || 5,
      imageUrl: newItemImageUrl.trim() || undefined,
      isAvailable: true,
    });
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: AnyFixMe[] = [];

    // Header check
    let startIdx = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('name') && (firstLine.includes('price') || firstLine.includes('category'))) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const category = parts[1] || 'General';
        const priceNum = parseFloat(parts[2] || '0') || 0;
        const description = parts[3] || undefined;
        parsed.push({
          name,
          category,
          unitPrice: Math.round(priceNum * 100),
          currency: currency || 'ZAR',
          description,
          maxQty: 5,
          isAvailable: true,
        });
      }
    }

    if (parsed.length === 0) {
      toast.error('Could not parse any items from CSV text.');
      return;
    }

    importItemsMutation.mutate(parsed);
  };

  if (!serviceId) {
    return (
      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
        <p className="font-semibold mb-1">Catalog ready on save</p>
        <p>Save this service first to start adding structured menu items and products.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const items: CatalogItem[] = catalog?.items || [];
  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'ALL' || (item.category || 'General') === activeCategory;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Service Catalog ({items.length} items)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              Menu dishes, retail products, and add-on items with dynamic pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button
            type="button"
            onClick={() => setIsAddingItem(true)}
            className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* CSV Import Modal / Overlay */}
      {isImportModalOpen && (
        <div className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-bold text-gray-900 dark:text-white">
              Bulk Import Items (CSV)
            </h5>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Paste rows with format: <code className="bg-gray-200 dark:bg-zinc-800 px-1 py-0.5 rounded">Name, Category, Price, Description</code>
          </p>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paneer Tikka, Starters, 45.00, Tandoori spiced cottage cheese\nDal Makhani, Mains, 80.00, Slow-cooked black lentils with cream\nLassi, Beverages, 30.00, Traditional sweet yogurt cooler`}
            className="w-full text-xs p-3 font-mono rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseCsv}
              disabled={importItemsMutation.isPending || !csvText.trim()}
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {importItemsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Import Items
            </button>
          </div>
        </div>
      )}

      {/* Add New Item Form */}
      {isAddingItem && (
        <form
          onSubmit={handleAddItem}
          className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              New Catalog Item
            </h5>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Butter Chicken"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                placeholder="e.g. Mains, Beverages, Starters"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Price ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="e.g. 75.00"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Max Qty Per Order
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newItemMaxQty}
                onChange={(e) => setNewItemMaxQty(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Ingredients, preparation details, allergens"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addItemMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {addItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Item
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items or categories..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  activeCategory === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                All ({items.length})
              </button>
              {categories.map((cat) => {
                const count = items.filter((i) => (i.category || 'General') === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-zinc-900/40 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
          <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">
            {items.length === 0
              ? 'No items in catalog yet. Click "+ Add Item" or "Import CSV" to get started.'
              : 'No items match your filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                item.isAvailable
                  ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
                  : 'bg-gray-50/70 dark:bg-zinc-950/40 border-gray-200/50 dark:border-zinc-800/40 opacity-70'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {item.category}
                    </span>
                  )}
                  {!item.isAvailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                      Sold Out
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                  {currency} {(item.unitPrice / 100).toFixed(2)}
                </span>

                {/* Quick Availability Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateItemMutation.mutate({
                      itemId: item.id,
                      data: { isAvailable: !item.isAvailable },
                    })
                  }
                  title={item.isAvailable ? 'Mark as Out of Stock' : 'Mark as Available'}
                  className={`text-[10px] px-2 py-1 rounded-md font-semibold transition-colors ${
                    item.isAvailable
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  {item.isAvailable ? 'In Stock' : 'Sold Out'}
                </button>

                <button
                  type="button"
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

