import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Upload,
  ShoppingBag,
  X,
  Loader2,
  Search,
  Pencil,
  Image as ImageIcon,
  Check,
  Eye,
  Lock,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';

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
  taxRate?: number;
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
  const { user } = useAuth();

  // Map permissions strictly to services & operations authority
  const canManageCatalog =
    user?.role === 'OWNER' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    Boolean(user?.allowedPages?.includes('settings-operations'));

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Editing existing item state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemMaxQty, setNewItemMaxQty] = useState('10');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [newItemTaxRate, setNewItemTaxRate] = useState('');

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['service-catalog', serviceId],
    queryFn: () =>
      serviceId ? fetchApi(`/service-catalog/by-service/${serviceId}`) : null,
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
      setNewItemCategory('');
      setNewItemDescription('');
      setNewItemPrice('');
      setNewItemImageUrl('');
      setNewItemTaxRate('');
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
      toast.success('Item updated');
      setEditingItem(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });

      if (res?.url) {
        if (target === 'new') {
          setNewItemImageUrl(res.url);
        } else if (target === 'edit' && editingItem) {
          setEditingItem({ ...editingItem, imageUrl: res.url });
        }
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err: AnyFixMe) {
      toast.error(err?.message || 'Failed to upload image file');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

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
      maxQty: parseInt(newItemMaxQty, 10) || 10,
      imageUrl: newItemImageUrl.trim() || undefined,
      taxRate: newItemTaxRate ? parseFloat(newItemTaxRate) : undefined,
      isAvailable: true,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !catalog?.id) return;
    const priceInCents = Math.round(parseFloat(editPrice || '0') * 100);

    updateItemMutation.mutate({
      itemId: editingItem.id,
      data: {
        name: editingItem.name.trim(),
        category: editingItem.category?.trim() || 'General',
        description: editingItem.description?.trim() || null,
        unitPrice: priceInCents,
        maxQty: editingItem.maxQty || 10,
        imageUrl: editingItem.imageUrl?.trim() || null,
        taxRate: editingItem.taxRate || null,
        isAvailable: editingItem.isAvailable,
      },
    });
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: AnyFixMe[] = [];

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
        const imageUrl = parts[4] || undefined;
        parsed.push({
          name,
          category,
          unitPrice: Math.round(priceNum * 100),
          currency: currency || 'ZAR',
          description,
          imageUrl,
          maxQty: 10,
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
        <p>Save this service first to start adding and customizing menu items, products, and images.</p>
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
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Service Catalog ({items.length} items)
              </h4>
              {!canManageCatalog && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-semibold">
                  <Lock className="w-3 h-3" /> Operations Authority Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              Dishes, burgers, sides, drinks & concert add-on products with pictures and pricing.
            </p>
          </div>
        </div>

        {canManageCatalog && (
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
              <Plus className="w-3.5 h-3.5" /> Add Product / Dish
            </button>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {isImportModalOpen && canManageCatalog && (
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
            Format: <code className="bg-gray-200 dark:bg-zinc-800 px-1 py-0.5 rounded">Name, Category, Price, Description, ImageUrl</code>
          </p>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Double Smash Cheeseburger, Burgers & Mains, 95.00, Two smashed beef patties with American cheese\nLoaded Bacon Fries, Sides, 55.00, Crinkle-cut fries with cheese & bacon\nVanilla Milkshake, Beverages, 45.00, Thick hand-spun ice cream shake`}
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

      {/* Hidden file input for Add Item */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, 'new')}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* Add New Item Form */}
      {isAddingItem && canManageCatalog && (
        <form
          onSubmit={handleAddItem}
          className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex justify-between items-center">
            <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              New Product / Menu Item
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
                Product Name *
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Classic Smash Double Cheeseburger"
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
                placeholder="e.g. Burgers, Sides, Beverages, Desserts"
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
                placeholder="e.g. 95.00"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Max Quantity Per Order
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
                Description & Ingredients
              </label>
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="e.g. Two smashed beef patties, melted American cheese, secret burger sauce & brioche bun"
                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Product Image Upload / URL */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                Product Image (Upload or URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  placeholder="https://... or upload an image file"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  Upload Image
                </button>
              </div>

              {newItemImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 w-fit">
                  <img
                    src={newItemImageUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-md object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[11px] text-gray-500">
                    <p className="font-semibold text-gray-800 dark:text-zinc-200">Image Loaded</p>
                    <button
                      type="button"
                      onClick={() => setNewItemImageUrl('')}
                      className="text-red-500 hover:underline text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
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
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {addItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Product
            </button>
          </div>
        </form>
      )}

      {/* Hidden file input for Edit Item */}
      <input
        type="file"
        ref={editFileInputRef}
        onChange={(e) => handleFileUpload(e, 'edit')}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* Edit Item Modal / Overlay */}
      {editingItem && canManageCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Edit Product / Customization
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
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
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                  Max Quantity Per Order
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editingItem.maxQty || 10}
                  onChange={(e) => setEditingItem({ ...editingItem, maxQty: parseInt(e.target.value, 10) || 10 })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                  Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                  Product Image (Upload or URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingItem.imageUrl || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                    placeholder="https://... or upload image"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Upload Image
                  </button>
                </div>

                {editingItem.imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-800 w-fit">
                    <img
                      src={editingItem.imageUrl}
                      alt="Product"
                      className="w-14 h-14 rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="text-[11px] text-gray-500">
                      <p className="font-semibold text-gray-800 dark:text-zinc-200">Current Product Photo</p>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, imageUrl: undefined })}
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:col-span-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isAvailable}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                  {editingItem.isAvailable ? 'In Stock (Available for ordering)' : 'Sold Out (Hidden from ordering)'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateItemMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {updateItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Customizations
              </button>
            </div>
          </form>
        </div>
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
                placeholder="Search products, descriptions, or categories..."
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
                All Dishes ({items.length})
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
              ? 'No items in catalog yet. Click "+ Add Product / Dish" or "Import CSV" to get started.'
              : 'No items match your filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                item.isAvailable
                  ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
                  : 'bg-gray-50/70 dark:bg-zinc-950/40 border-gray-200/50 dark:border-zinc-800/40 opacity-70'
              }`}
            >
              {/* Product Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {item.category}
                    </span>
                  )}
                  {!item.isAvailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shrink-0">
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

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                  {currency} {(item.unitPrice / 100).toFixed(2)}
                </span>

                {canManageCatalog ? (
                  <>
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

                    {/* Edit Customizations Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditPrice((item.unitPrice / 100).toFixed(2));
                      }}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit customizations & photo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-gray-400 px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded">
                    View Only
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
