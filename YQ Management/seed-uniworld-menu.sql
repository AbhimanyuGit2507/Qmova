-- 1. Enable catalog on ChefTalk: Uniworld Mess service
UPDATE "Service" 
SET "enableCatalog" = true, "updatedAt" = NOW() 
WHERE id = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

-- 2. Insert or update ServiceCatalog for ChefTalk: Uniworld Mess
INSERT INTO "ServiceCatalog" (
  id, "tenantId", "serviceId", name, currency, "isActive", "createdAt", "updatedAt"
)
VALUES (
  'c0000001-beef-4000-8000-000000000001',
  'c1a6ab78-2b28-4e89-8d4e-1234567890ab',
  'a6e2effe-33ef-461d-82df-e5d906d322cc',
  'Uniworld Mess Daily Menu & Catering',
  'ZAR',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE 
SET name = EXCLUDED.name, "isActive" = true, "updatedAt" = NOW();

-- 3. Clear any existing items for this catalog to ensure clean idempotent insert
DELETE FROM "ServiceCatalogItem" WHERE "catalogId" = (
  SELECT id FROM "ServiceCatalog" WHERE "serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc'
);

-- 4. Insert Menu Items across Starters, Main Course, Desserts, Beverages
INSERT INTO "ServiceCatalogItem" (
  id, "catalogId", name, description, category, "unitPrice", currency, "maxQty", "isAvailable", "sortOrder", "createdAt", "updatedAt"
)
SELECT 
  v.id,
  c.id,
  v.name,
  v.description,
  v.category,
  v.unitPrice,
  'ZAR',
  10,
  true,
  v.sortOrder,
  NOW(),
  NOW()
FROM "ServiceCatalog" c
CROSS JOIN (VALUES
  -- Starters
  ('item-cat-001', 'Paneer Tikka', 'Spiced cottage cheese cubes marinated in yogurt & grilled in a clay oven', 'Starters', 3500, 1),
  ('item-cat-002', 'Crispy Veg Spring Rolls', 'Crispy golden rolls filled with shredded seasonal vegetables & sweet chilli dip', 'Starters', 2800, 2),
  ('item-cat-003', 'Hara Bhara Kebab', 'Pan-fried patties made with fresh spinach, green peas, and fragrant herbs', 'Starters', 3000, 3),
  ('item-cat-004', 'Chicken Malai Tikka', 'Tender chicken morsels marinated in fresh cream, cheese, and mild royal spices', 'Starters', 4500, 4),

  -- Main Course
  ('item-cat-005', 'Dal Makhani', 'Slow-cooked whole black lentils simmered overnight with butter and fresh cream', 'Main Course', 4500, 5),
  ('item-cat-006', 'Paneer Butter Masala', 'Rich, mildly sweet tomato-cashew curry with velvety cottage cheese cubes', 'Main Course', 5500, 6),
  ('item-cat-007', 'Chicken Tikka Masala', 'Chargrilled chicken tikka pieces in a robust aromatic spiced masala gravy', 'Main Course', 6500, 7),
  ('item-cat-008', 'Veg Dum Biryani', 'Fragrant basmati rice layered with spiced garden vegetables and saffron, served with raita', 'Main Course', 5000, 8),
  ('item-cat-009', 'Butter Naan', 'Traditional clay-tandoor baked leavened flatbread brushed with fresh butter', 'Main Course', 1200, 9),
  ('item-cat-010', 'Jeera Rice', 'Steamed long-grain basmati rice tempered with toasted cumin seeds and pure ghee', 'Main Course', 2000, 10),

  -- Desserts
  ('item-cat-011', 'Hot Gulab Jamun [2 pcs]', 'Warm milk-solid dumplings fried golden and soaked in cardamom saffron syrup', 'Desserts', 2200, 11),
  ('item-cat-012', 'Rasgulla [2 pcs]', 'Soft, spongy chhena spheres poached in a delicate rose sugar syrup', 'Desserts', 2000, 12),
  ('item-cat-013', 'Warm Chocolate Brownie with Ice Cream', 'Rich fudgy warm chocolate brownie topped with a scoop of vanilla ice cream', 'Desserts', 3200, 13),

  -- Beverages
  ('item-cat-014', 'Sweet Mango Lassi', 'Thick, creamy churned yogurt blended with authentic Alphonso mango pulp', 'Beverages', 2500, 14),
  ('item-cat-015', 'Masala Chai', 'Brewed black tea infused with fresh crushed ginger, cardamom, and whole spices', 'Beverages', 1500, 15),
  ('item-cat-016', 'Fresh Lime Soda', 'Sparkling mineral soda with freshly squeezed lime juice, mint, and rock salt', 'Beverages', 1800, 16)
) AS v(id, name, description, category, unitPrice, sortOrder)
WHERE c."serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc';

-- 5. Shift existing flow step orders for flow 24aed71c-c809-41c7-ba60-19c5b2115871 if ORDER step does not exist yet
DO $$
DECLARE
  cat_id text;
  order_step_exists boolean;
  order_items_json jsonb;
BEGIN
  SELECT id INTO cat_id FROM "ServiceCatalog" WHERE "serviceId" = 'a6e2effe-33ef-461d-82df-e5d906d322cc';
  
  SELECT EXISTS (
    SELECT 1 FROM "FlowStepTemplate" 
    WHERE "flowId" = '24aed71c-c809-41c7-ba60-19c5b2115871' AND type = 'ORDER'
  ) INTO order_step_exists;

  -- Build orderItems JSON array from ServiceCatalogItem
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'category', category,
      'unitPrice', "unitPrice",
      'currency', currency,
      'maxQty', "maxQty"
    ) ORDER BY "sortOrder"
  ) INTO order_items_json
  FROM "ServiceCatalogItem"
  WHERE "catalogId" = cat_id;

  IF NOT order_step_exists THEN
    -- Shift steps >= 1 up by 1
    UPDATE "FlowStepTemplate" 
    SET "stepOrder" = "stepOrder" + 1 
    WHERE "flowId" = '24aed71c-c809-41c7-ba60-19c5b2115871' AND "stepOrder" >= 1;

    -- Insert ORDER step at stepOrder = 1
    INSERT INTO "FlowStepTemplate" (
      id, "flowId", "stepOrder", name, description, type, trigger,
      "isOptional", "isRepeatable", "requiresQrScan", "requiresStaffAction",
      "stepPriceCurrency", "isPriceVariable", "isSystem",
      "orderMultiSelect", "orderShowPrices", "orderCatalogId", "orderItems",
      "customerInstruction", "staffInstruction", "createdAt", "updatedAt"
    ) VALUES (
      's0000001-beef-4000-8000-000000000001',
      '24aed71c-c809-41c7-ba60-19c5b2115871',
      1,
      'Meal & Catering Order',
      'Select starters, mains, desserts, and beverages from the mess catering menu',
      'ORDER',
      'MANUAL_STAFF',
      false,
      false,
      false,
      false,
      'ZAR',
      false,
      false,
      true,
      true,
      cat_id,
      order_items_json,
      'Please select your dishes from the catering menu.',
      'Prepare ordered catering dishes for customer collection.',
      NOW(),
      NOW()
    );
  ELSE
    -- Update existing ORDER step with latest items and catalogId
    UPDATE "FlowStepTemplate"
    SET "orderCatalogId" = cat_id,
        "orderItems" = order_items_json,
        "updatedAt" = NOW()
    WHERE "flowId" = '24aed71c-c809-41c7-ba60-19c5b2115871' AND type = 'ORDER';
  END IF;
END $$;

