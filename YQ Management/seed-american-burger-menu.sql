-- 1. Update Service Name and Description to American Burger Place / Concert Theme
UPDATE "Service" 
SET name = 'All-American Burger Co. - Concert & Stadium Mess',
    description = 'Hand-smashed craft burgers, loaded fries, crispy chicken tenders, milkshakes, and stadium concert treats.',
    "enableCatalog" = true,
    "updatedAt" = NOW() 
WHERE id = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

-- 2. Update ServiceCatalog name
UPDATE "ServiceCatalog"
SET name = 'All-American Burger Co. Concert Menu',
    currency = 'ZAR',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE "serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

-- 3. Clear old items
DELETE FROM "ServiceCatalogItem" WHERE "catalogId" = (
  SELECT id FROM "ServiceCatalog" WHERE "serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc'
);

-- 4. Insert new American Burger Place Menu with Images
INSERT INTO "ServiceCatalogItem" (
  id, "catalogId", name, description, category, "unitPrice", currency, "imageUrl", "maxQty", "isAvailable", "sortOrder", "createdAt", "updatedAt"
)
SELECT 
  v.id,
  c.id,
  v.name,
  v.description,
  v.category,
  v.unitPrice,
  'ZAR',
  v.imageUrl,
  10,
  true,
  v.sortOrder,
  NOW(),
  NOW()
FROM "ServiceCatalog" c
CROSS JOIN (VALUES
  -- Burgers & Hot Dogs
  ('item-ab-001', 'Classic Double Smash Cheeseburger', 'Two smashed beef patties, melted American cheese, house secret burger sauce, dill pickles & toasted brioche bun', 'Burgers & Hot Dogs', 9500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', 1),
  ('item-ab-002', 'Crispy Buttermilk Fried Chicken Burger', 'Southern fried crispy chicken breast, creamy slaw, chipotle ranch & sliced pickles on brioche', 'Burgers & Hot Dogs', 8500, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80', 2),
  ('item-ab-003', 'Bacon & BBQ Smokehouse Burger', 'Flame-grilled beef patty, crispy bacon strips, smoked cheddar, bourbon BBQ sauce & crispy onion rings', 'Burgers & Hot Dogs', 11000, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80', 3),
  ('item-ab-004', 'Beyond Plant-Based Smash Burger', '100% plant-based patty, vegan cheddar, fresh crisp lettuce, heirloom tomato & garlic aioli', 'Burgers & Hot Dogs', 9000, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&auto=format&fit=crop&q=80', 4),
  ('item-ab-005', 'Stadium Jumbo Hot Dog', 'All-beef grilled jumbo frankfurter in a soft warm bun with American mustard, ketchup, sweet relish & crispy onions', 'Burgers & Hot Dogs', 6500, 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&auto=format&fit=crop&q=80', 5),

  -- Loaded Sides & Starters
  ('item-ab-006', 'Loaded Bacon Cheddar Fries', 'Golden crinkle-cut fries smothered in warm aged cheddar sauce, smoky bacon crumbles, jalapeños & ranch', 'Sides & Starters', 5500, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=80', 6),
  ('item-ab-007', 'Classic Skin-On French Fries', 'Crispy golden sea-salt french fries served hot with house dipping sauce', 'Sides & Starters', 3500, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80', 7),
  ('item-ab-008', 'Beer-Battered Onion Rings', 'Thick-cut jumbo onion rings in a crunchy beer batter with smoky comeback sauce', 'Sides & Starters', 4000, 'https://images.unsplash.com/photo-1639024471287-032f6644dd40?w=500&auto=format&fit=crop&q=80', 8),
  ('item-ab-009', 'Nashville Hot Chicken Tenders [4 pcs]', 'Crispy hand-breaded chicken tenders tossed in spicy Nashville hot honey with ranch dip', 'Sides & Starters', 6500, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80', 9),
  ('item-ab-010', 'Stadium Nachos Supreme', 'Warm tortilla chips layered with molten queso cheese, jalapeño slices, fresh salsa roja & sour cream', 'Sides & Starters', 6000, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=80', 10),

  -- Desserts
  ('item-ab-011', 'Warm Cinnamon Sugar Churros [3 pcs]', 'Crispy fried pastry churros tossed in cinnamon sugar with warm salted caramel & chocolate fudge dip', 'Desserts', 4500, 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=500&auto=format&fit=crop&q=80', 11),
  ('item-ab-012', 'Glazed Donut Box [2 pcs]', 'Fluffy yeast-raised donuts dipped in sweet Madagascar vanilla glaze', 'Desserts', 3500, 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=500&auto=format&fit=crop&q=80', 12),
  ('item-ab-013', 'Soft-Serve Sundae Cup', 'Creamy vanilla soft-serve swirled with chocolate fudge, rainbow sprinkles & a cherry on top', 'Desserts', 3000, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80', 13),

  -- Beverages & Shakes
  ('item-ab-014', 'Thick Hand-Spun Milkshake', 'Creamy hand-spun ice cream shake topped with whipped cream (Vanilla, Chocolate or Strawberry)', 'Beverages', 4500, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', 14),
  ('item-ab-015', 'Chilled Draft Root Beer Float', 'Classic frosty draft root beer poured over a generous scoop of vanilla bean ice cream', 'Beverages', 4000, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=80', 15),
  ('item-ab-016', 'Fresh Squeezed Stadium Lemonade', 'Ice-cold tart and sweet hand-squeezed lemonade with fresh lemon wheels and crushed ice', 'Beverages', 3000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', 16),
  ('item-ab-017', 'Fountain Soda [500ml]', 'Ice-cold fountain soft drink (Coca-Cola, Sprite, Fanta, or Coke Zero)', 'Beverages', 2500, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80', 17)
) AS v(id, name, description, category, unitPrice, imageUrl, sortOrder)
WHERE c."serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

-- 5. Update FlowStepTemplate order items with latest American Burger menu
DO $$
DECLARE
  cat_id text;
  order_items_json jsonb;
BEGIN
  SELECT id INTO cat_id FROM "ServiceCatalog" WHERE "serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'category', category,
      'unitPrice', "unitPrice",
      'currency', currency,
      'imageUrl', "imageUrl",
      'maxQty', "maxQty"
    ) ORDER BY "sortOrder"
  ) INTO order_items_json
  FROM "ServiceCatalogItem"
  WHERE "catalogId" = cat_id;

  UPDATE "FlowStepTemplate"
  SET name = 'Concert Burger & Catering Order',
      description = 'Order smash burgers, hot dogs, loaded fries, desserts, and concert drinks',
      "orderCatalogId" = cat_id,
      "orderItems" = order_items_json,
      "updatedAt" = NOW()
  WHERE "flowId" = '24aed71c-c809-41c7-ba60-19c5b2115871' AND type = 'ORDER';
END $$;

