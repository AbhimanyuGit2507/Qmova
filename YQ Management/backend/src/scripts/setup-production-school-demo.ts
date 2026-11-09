import { PrismaClient, StepType, StepTrigger, VisitState, VisitStepStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as crypto from 'crypto';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5455/yq_queue?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting School Annual Function & Catering Production Setup...');

  // 1. Ensure Pro Plan exists with 14-day trial configuration
  let proPlan = await prisma.plan.findFirst({
    where: { id: 'pro-plan' },
  });

  if (!proPlan) {
    proPlan = await prisma.plan.create({
      data: {
        id: 'pro-plan',
        name: 'Pro Plan',
        description: 'Advanced event workflows, multi-queue catering, high volume & custom branding',
        type: 'premium',
        price: 20,
        currency: 'USD',
        billingInterval: 'monthly',
        trialDays: 14,
        maxVisits: 10000,
        active: true,
        sortOrder: 3,
        features: {
          textToSpeech: true,
          whatsappNotifications: true,
          customBranding: true,
          serviceFlows: true,
        },
        limits: {
          maxServices: 20,
          maxLocations: 10,
          maxStaff: 50,
          maxVisits: 10000,
        },
      },
    });
    console.log('✅ Created Pro Plan:', proPlan.id);
  }

  // 2. Upsert School Events Tenant
  const tenantSubdomain = 'school-events';
  let tenant = await prisma.tenant.findUnique({
    where: { subdomain: tenantSubdomain },
  });

  const tenantData = {
    name: 'Summit Ridge Academy (Annual Concert & Fair)',
    subdomain: tenantSubdomain,
    businessType: 'catering',
    operatingMode: 'JOURNEY' as const,
    appointmentApprovalMode: 'AUTO',
    setupComplete: true,
    selfServeModeEnabled: true,
    strictPrivacyMode: false,
    customerExperience: {
      enableWaitlist: true,
      autoCallNext: false,
      language: 'en',
      theme: 'school',
      bannerNotice: 'Welcome to the 2026 Summit Ridge Annual Concert & Carnival Fair!',
    },
  };

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: tenantData,
    });
    console.log('✅ Created Tenant:', tenant.id, tenant.name, `(${tenant.subdomain})`);
  } else {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: tenantData,
    });
    console.log('✅ Updated Tenant:', tenant.id, tenant.name);
  }

  // 3. Assign 14-Day Pro Trial Subscription
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      planId: proPlan.id,
      status: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
    },
    update: {
      planId: proPlan.id,
      status: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd,
      currentPeriodEnd: trialEnd,
    },
  });
  console.log('✅ 14-Day Pro Trial Subscription active until:', trialEnd.toISOString());

  // 4. Upsert Campus Location
  let location = await prisma.location.findFirst({
    where: { tenantId: tenant.id },
  });

  const locationData = {
    tenantId: tenant.id,
    name: 'Main Campus & Sports Grounds',
    address: '124 Ridgeview Road, Sandton, Johannesburg',
    timezone: 'Africa/Johannesburg',
    businessHours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '08:00', close: '23:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: false },
    },
  };

  if (!location) {
    location = await prisma.location.create({ data: locationData });
    console.log('✅ Created Location:', location.id, location.name);
  } else {
    location = await prisma.location.update({
      where: { id: location.id },
      data: locationData,
    });
    console.log('✅ Updated Location:', location.id);
  }

  // 5. Upsert Admin User Credentials
  const hashedPassword = await bcrypt.hash('SchoolEvent2026!', 10);
  const adminEmail = 'events@schooldemo.co.za';
  const yqAdminEmail = 'events@yqbuddy.com';

  for (const email of [adminEmail, yqAdminEmail]) {
    let u = await prisma.user.findFirst({
      where: { email },
    });

    if (!u) {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Sister Mary (Event Coordinator)',
          phone: '+27821112233',
          role: 'ADMIN',
          tenantId: tenant.id,
          allowedLocationIds: [location.id],
        },
      });
      console.log('✅ Created Admin User:', email);
    } else {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'ADMIN',
          allowedLocationIds: [location.id],
        },
      });
      console.log('✅ Updated Admin User Credentials:', email);
    }
  }

  // 6. Define Services, Queues, and Execution Flows
  const commonFormConfig = [
    { id: 'childName', type: 'text', label: "Child's First Name", required: true },
    { id: 'childSurname', type: 'text', label: "Child's Surname", required: true },
    { id: 'gradeClass', type: 'text', label: 'Grade & Class (e.g. Grade 4B)', required: true },
    { id: 'platesPurchased', type: 'number', label: 'Catering Plates / Meals Purchased', required: true },
    { id: 'dietaryRequirements', type: 'text', label: 'Dietary Notes (e.g. Halaal, Vegetarian, Nut Allergy)', required: false },
  ];

  interface CatalogItemSpec {
    name: string;
    category: string;
    description: string;
    unitPrice: number; // in cents
    imageUrl: string;
    maxQty?: number;
    sortOrder?: number;
  }

  interface ServiceSpec {
    name: string;
    description: string;
    queueName: string;
    price: number;
    stepName: string;
    stepType: StepType;
    formula?: string;
    unit?: string;
    preventDouble?: boolean;
    allowPartial?: boolean;
    customerInstruction: string;
    staffInstruction: string;
    locationDesc: string;
    catalogName?: string;
    catalogItems?: CatalogItemSpec[];
  }

  const serviceSpecs: ServiceSpec[] = [
    {
      name: 'Annual Concert: Gate Admission & Attendance Register',
      description: 'Main gate entry checkpoint. Scan attendee QR codes to record electronic attendance in real-time.',
      queueName: 'Main Gate Reception Desk',
      price: 5000, // R50.00
      stepName: 'Gate Attendance Check-In',
      stepType: 'CHECKPOINT',
      preventDouble: true,
      allowPartial: false,
      customerInstruction: 'Welcome to Summit Ridge! Please present your family QR code to the gate steward.',
      staffInstruction: 'Scan family QR. Verify child details and tap "Check In / Clear Attendance".',
      locationDesc: 'Main Entrance Gate (Campus Drive)',
    },
    {
      name: 'Annual Concert: Food Stall 1 - Braai & Spit Roast Plates',
      description: 'Primary catered dinner collection. Traditional braai platters, sides, and hot buffet.',
      queueName: 'Food Stall 1 (Spit Braai & Traditional)',
      price: 10000, // R100.00
      stepName: 'Braai & Spit Roast Plate Redemption',
      stepType: 'COLLECTION',
      unit: 'plates',
      preventDouble: true,
      allowPartial: true,
      customerInstruction: 'Present your QR code at Food Stall 1 to collect your braai dinner plates.',
      staffInstruction: 'Scan QR. Verify plate count. Tap "Give All Remaining" or "Give 1 plate". Double-redemption blocked.',
      locationDesc: 'Food Court - Stall 1 (Dining Hall Lawn)',
      catalogName: 'Braai & Spit Roast Banquet Menu',
      catalogItems: [
        {
          name: 'Karoo Lamb Spit Roast Platter',
          category: 'Braai Platters & Mains',
          description: 'Slow spit-roasted Karoo lamb carved fresh, served with rosemary baby potatoes, roosterkoek, and honey-glazed butternut.',
          unitPrice: 13500, // R135.00
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 1,
        },
        {
          name: 'Smoked BBQ Half Chicken',
          category: 'Braai Platters & Mains',
          description: 'Flame-grilled lemon & herb half chicken with charred sweet corn on the cob and house-made chakalaka.',
          unitPrice: 9500, // R95.00
          imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 2,
        },
        {
          name: 'Traditional Boerewors Roll Deluxe',
          category: 'Braai Platters & Mains',
          description: '100% pure beef artisanal boerewors grilled over open coals, caramelized red onions, and sweet tomato smoor on a fresh roll.',
          unitPrice: 5500, // R55.00
          imageUrl: 'https://images.unsplash.com/photo-1627054234610-8b173167724a?w=600&auto=format&fit=crop&q=80',
          maxQty: 15,
          sortOrder: 3,
        },
        {
          name: 'Gourmet Veggie Potjie Bowl (V)',
          category: 'Vegetarian & Sides',
          description: 'Hearty slow-cooked seasonal vegetables and butter beans in cast-iron potjie with fragrant yellow rice.',
          unitPrice: 8000, // R80.00
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 4,
        },
        {
          name: 'Creamy Potato Bake & Greek Salad',
          category: 'Vegetarian & Sides',
          description: 'Double-cheddar potato gratin bake served with fresh garden greens, Kalamata olives, and Danish feta.',
          unitPrice: 4500, // R45.00
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 5,
        },
        {
          name: 'Traditional Warm Malva Pudding',
          category: 'Desserts & Beverages',
          description: 'Classic moist sponge pudding baked with apricot jam and soaked in warm butter-caramel sauce, served with vanilla custard.',
          unitPrice: 4000, // R40.00
          imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 6,
        },
        {
          name: 'Brewed Peach Rooibos Iced Tea (500ml)',
          category: 'Desserts & Beverages',
          description: 'Cold-brewed organic Cederberg Rooibos tea with fresh sliced peaches and garden mint.',
          unitPrice: 2500, // R25.00
          imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
          maxQty: 15,
          sortOrder: 7,
        },
      ],
    },
    {
      name: 'Annual Concert: Food Stall 2 - Pizza, Burgers & Snacks Express',
      description: 'Fast-moving food station for kids meals, artisan pizzas, and cold beverage combos.',
      queueName: 'Food Stall 2 (Pizza & Burger Express)',
      price: 8000, // R80.00
      stepName: 'Fast Food & Kids Meal Collection',
      stepType: 'COLLECTION',
      unit: 'combos',
      preventDouble: true,
      allowPartial: true,
      customerInstruction: 'Show your QR code at Food Stall 2 to redeem your pizza and burger meal combos.',
      staffInstruction: 'Scan QR. Dispense meal boxes and mark redemption on screen.',
      locationDesc: 'Food Court - Stall 2 (Adjacent to Pavilion)',
      catalogName: 'Pizza, Burgers & Kids Express Menu',
      catalogItems: [
        {
          name: 'Artisan Margherita Pizza (30cm)',
          category: 'Woodfired Pizzas',
          description: 'Hand-stretched sourdough base, San Marzano tomato sauce, fior di latte mozzarella, and fresh basil leaves.',
          unitPrice: 8500, // R85.00
          imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 1,
        },
        {
          name: 'Spicy Pepperoni & Hot Honey Pizza',
          category: 'Woodfired Pizzas',
          description: 'Italian salami pepperoni, smoked provolone, chili flakes, and hot chili-infused honey drizzle.',
          unitPrice: 9800, // R98.00
          imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 2,
        },
        {
          name: 'Double Smash Cheeseburger & Fries',
          category: 'Burgers & Baskets',
          description: 'Two 100g beef smash patties, double aged cheddar, gherkins, smoky burger relish, and golden salted shoestring fries.',
          unitPrice: 9000, // R90.00
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 3,
        },
        {
          name: 'Kids Crispy Chicken Strips Basket',
          category: 'Burgers & Baskets',
          description: 'Crumbed tender chicken breast strips, smiley potato faces, fruit juice box, and tomato ketchup dip.',
          unitPrice: 6500, // R65.00
          imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 4,
        },
        {
          name: 'Loaded Cheesy Nachos Bowl',
          category: 'Snacks & Cold Drinks',
          description: 'Crispy corn tortillas smothered in melted queso cheese, chunky guacamole, fresh salsa, and sour cream.',
          unitPrice: 5500, // R55.00
          imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 5,
        },
        {
          name: 'Chilled Soft Drink Can (330ml)',
          category: 'Snacks & Cold Drinks',
          description: 'Your choice of Coca-Cola, Coke Zero, Sprite, Fanta Orange, or Stoney Ginger Beer.',
          unitPrice: 2000, // R20.00
          imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
          maxQty: 20,
          sortOrder: 6,
        },
      ],
    },
    {
      name: 'Annual Concert: Games & Carnival Fun Fair Stall',
      description: 'Activity & games token booth. Redeem play tokens for bouncy castles, face painting, and carnival games.',
      queueName: 'Carnival Games & Token Station',
      price: 2000, // R20.00
      stepName: 'Game Tokens & Activity Passes Issuance',
      stepType: 'COLLECTION',
      formula: 'unlimited',
      unit: 'passes',
      preventDouble: false,
      allowPartial: true,
      customerInstruction: 'Scan your QR at the Carnival Token Booth to receive your game tokens and ride wristbands.',
      staffInstruction: 'Scan QR. Issue physical token coins or wristband passes. Unlimited pass scanning supported.',
      locationDesc: 'Sports Field - Carnival Arena',
      catalogName: 'Carnival Rides, Tokens & Activities',
      catalogItems: [
        {
          name: 'All-Day Unlimited Carnival Ride Wristband',
          category: 'Passes & Wristbands',
          description: 'All-day infinite access to giant bouncy castles, inflatable obstacle courses, carousel swings, and carnival slides.',
          unitPrice: 15000, // R150.00
          imageUrl: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 1,
        },
        {
          name: '10-Game Carnival Token Pack',
          category: 'Tokens & Game Packs',
          description: 'Bundle of 10 brass game tokens for balloon darts, ring toss, knock-the-cans, and duck pond prize games.',
          unitPrice: 8000, // R80.00
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 2,
        },
        {
          name: 'Super Fun Face Painting & Glitter Tattoo',
          category: 'Attractions',
          description: 'Full face artistry by professional artists (tiger, superhero, butterfly, fairy) with cosmetic eco-glitter.',
          unitPrice: 4500, // R45.00
          imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 3,
        },
        {
          name: 'Dunk Tank 3-Ball Throw Challenge',
          category: 'Attractions',
          description: '3 chances to hit the bullseye and plunge the school principal or sports coach into the dunking pool!',
          unitPrice: 3000, // R30.00
          imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
          maxQty: 10,
          sortOrder: 4,
        },
        {
          name: 'Giant Pink Cotton Candy Cloud',
          category: 'Carnival Treats',
          description: 'Freshly spun sweet strawberry fairy floss on a giant glow stick wand.',
          unitPrice: 2500, // R25.00
          imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80',
          maxQty: 15,
          sortOrder: 5,
        },
        {
          name: 'Warm Buttered Popcorn Mega Bucket',
          category: 'Carnival Treats',
          description: 'Freshly popped cinema-style salted butter popcorn in a souvenir Summit Ridge carnival bucket.',
          unitPrice: 2500, // R25.00
          imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80',
          maxQty: 15,
          sortOrder: 6,
        },
      ],
    },
    {
      name: 'Graduation & Prizegiving: Regalia & Refreshments',
      description: 'Future event template: Cap & gown collection, photography queue, and celebratory refreshment box.',
      queueName: 'Graduation Regalia & Package Desk',
      price: 15000, // R150.00
      stepName: 'Cap, Gown & Refreshment Redemption',
      stepType: 'COLLECTION',
      unit: 'regalia package',
      preventDouble: true,
      allowPartial: false,
      customerInstruction: 'Collect your graduate academic sash, graduation cap, and post-ceremony celebration package.',
      staffInstruction: 'Verify graduate identity. Issue correct sizing and mark package fulfilled.',
      locationDesc: 'Auditorium Foyer - Desk 4',
    },
  ];

  const createdServices: Record<string, any> = {};

  for (const spec of serviceSpecs) {
    // Upsert Service
    let svc = await prisma.service.findFirst({
      where: { tenantId: tenant.id, name: spec.name },
    });

    const svcData = {
      tenantId: tenant.id,
      locationId: location.id,
      name: spec.name,
      description: spec.description,
      expectedDuration: 15,
      basePrice: spec.price,
      paymentMode: 'UPFRONT',
      priceCurrency: 'ZAR',
      requiresPayment: true,
      allowOfflinePayment: true,
      formConfig: commonFormConfig,
      allowAppointments: true,
      enableCatalog: Boolean(spec.catalogName),
    };

    if (!svc) {
      svc = await prisma.service.create({ data: svcData });
      console.log(`✅ Created Service: "${svc.name}"`);
    } else {
      svc = await prisma.service.update({
        where: { id: svc.id },
        data: svcData,
      });
      console.log(`✅ Updated Service: "${svc.name}"`);
    }
    createdServices[spec.name] = svc;

    // Upsert Service Catalog & Items
    if (spec.catalogName && spec.catalogItems && spec.catalogItems.length > 0) {
      let catalog = await prisma.serviceCatalog.findUnique({
        where: { serviceId: svc.id },
      });

      if (!catalog) {
        catalog = await prisma.serviceCatalog.create({
          data: {
            tenantId: tenant.id,
            serviceId: svc.id,
            name: spec.catalogName,
            currency: 'ZAR',
            isActive: true,
          },
        });
        console.log(`✅ Created Catalog: "${catalog.name}" for Service "${svc.name}"`);
      } else {
        catalog = await prisma.serviceCatalog.update({
          where: { id: catalog.id },
          data: {
            name: spec.catalogName,
            currency: 'ZAR',
            isActive: true,
          },
        });
        console.log(`✅ Updated Catalog: "${catalog.name}" for Service "${svc.name}"`);
      }

      // Upsert catalog items
      await prisma.serviceCatalogItem.deleteMany({
        where: { catalogId: catalog.id },
      });

      for (const item of spec.catalogItems) {
        await prisma.serviceCatalogItem.create({
          data: {
            catalogId: catalog.id,
            name: item.name,
            description: item.description,
            category: item.category,
            unitPrice: item.unitPrice,
            currency: 'ZAR',
            imageUrl: item.imageUrl,
            maxQty: item.maxQty || 10,
            isAvailable: true,
            sortOrder: item.sortOrder || 0,
          },
        });
      }
      console.log(`  🍱 Populated ${spec.catalogItems.length} catalog items with images & pricing for "${svc.name}"`);
    }

    // Upsert Queue
    let q = await prisma.queue.findFirst({
      where: { tenantId: tenant.id, name: spec.queueName },
      include: { services: true },
    });

    if (!q) {
      q = await prisma.queue.create({
        data: {
          tenantId: tenant.id,
          locationId: location.id,
          name: spec.queueName,
          status: 'ACTIVE',
          services: { connect: [{ id: svc.id }] },
        },
        include: { services: true },
      });
      console.log(`✅ Created Queue: "${q.name}"`);
    } else {
      if (!q.services.some((s) => s.id === svc.id)) {
        await prisma.queue.update({
          where: { id: q.id },
          data: { services: { connect: [{ id: svc.id }] } },
        });
      }
    }

    // Upsert Service Flow
    let flow = await prisma.serviceFlow.findUnique({
      where: { serviceId: svc.id },
      include: { steps: true },
    });

    if (!flow) {
      flow = await prisma.serviceFlow.create({
        data: {
          tenantId: tenant.id,
          serviceId: svc.id,
          name: `${spec.name} Flow`,
          description: spec.description,
          isActive: true,
          allowPartialCompletion: spec.allowPartial ?? false,
        },
        include: { steps: true },
      });

      // System Bookend 0: Check-in
      await prisma.flowStepTemplate.create({
        data: {
          flowId: flow.id,
          stepOrder: 0,
          name: 'Check-in (Booking)',
          description: 'Parent registers online or via WhatsApp and receives family QR ticket.',
          type: 'CHECK_IN',
          trigger: 'MANUAL_CUSTOMER',
          isSystem: true,
          requiresQrScan: false,
          requiresStaffAction: false,
          notifyCustomerOnActivation: false,
        },
      });

      // Action Step 1:
      const step1 = await prisma.flowStepTemplate.create({
        data: {
          flowId: flow.id,
          stepOrder: 1,
          name: spec.stepName,
          description: spec.description,
          type: spec.stepType,
          trigger: 'MANUAL_STAFF',
          requiresQrScan: true,
          requiresStaffAction: true,
          entitlementUnit: spec.unit || (spec.stepType === 'COLLECTION' ? 'units' : undefined),
          entitlementFormula: spec.formula || (spec.stepType === 'COLLECTION' ? 'accompanyingGuests + 1' : undefined),
          preventDoubleRedemption: spec.formula === 'unlimited' ? false : (spec.preventDouble ?? true),
          allowPartialRedemption: spec.allowPartial ?? false,
          customerInstruction: spec.customerInstruction,
          staffInstruction: spec.staffInstruction,
          locationDescription: spec.locationDesc,
        },
      });

      // System Bookend 99: Check-out
      const stepOut = await prisma.flowStepTemplate.create({
        data: {
          flowId: flow.id,
          stepOrder: 99,
          name: 'Check-out (Fulfillment Complete)',
          description: 'Station staff marks visit complete.',
          type: 'CHECK_OUT',
          trigger: 'MANUAL_STAFF',
          isSystem: true,
          requiresQrScan: false,
          notifyCustomerOnActivation: false,
        },
      });

      // Transition Step 1 -> Step 99
      await prisma.flowStepTransition.create({
        data: {
          flowId: flow.id,
          fromStepId: step1.id,
          toStepId: stepOut.id,
          isDefault: true,
        },
      });
      console.log(`✅ Configured Execution Flow for: "${spec.name}"`);
    } else {
      // Ensure existing step 1 properties match
      await prisma.flowStepTemplate.updateMany({
        where: { flowId: flow.id, stepOrder: 1 },
        data: {
          name: spec.stepName,
          type: spec.stepType,
          entitlementUnit: spec.unit || (spec.stepType === 'COLLECTION' ? 'units' : undefined),
          entitlementFormula: spec.formula || (spec.stepType === 'COLLECTION' ? 'accompanyingGuests + 1' : undefined),
          preventDoubleRedemption: spec.formula === 'unlimited' ? false : (spec.preventDouble ?? true),
          allowPartialRedemption: spec.allowPartial ?? false,
          customerInstruction: spec.customerInstruction,
          staffInstruction: spec.staffInstruction,
          locationDescription: spec.locationDesc,
        },
      });
    }
  }

  // 7. Seed Realistic Demo Visitors & Scenarios
  console.log('🧑‍🤝‍🧑 Seeding Realistic Demo Attendees & Scenarios...');

  const foodSvc1 = createdServices['Annual Concert: Food Stall 1 - Braai & Spit Roast Plates'];
  const foodSvc2 = createdServices['Annual Concert: Food Stall 2 - Pizza, Burgers & Snacks Express'];
  const gamesSvc = createdServices['Annual Concert: Games & Carnival Fun Fair Stall'];

  const foodFlow1 = await prisma.serviceFlow.findUnique({
    where: { serviceId: foodSvc1.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  const foodFlow2 = await prisma.serviceFlow.findUnique({
    where: { serviceId: foodSvc2.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  const gamesFlow = await prisma.serviceFlow.findUnique({
    where: { serviceId: gamesSvc.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  const foodQueue1 = await prisma.queue.findFirst({ where: { tenantId: tenant.id, name: 'Food Stall 1 (Spit Braai & Traditional)' } });
  const foodQueue2 = await prisma.queue.findFirst({ where: { tenantId: tenant.id, name: 'Food Stall 2 (Pizza & Burger Express)' } });
  const gamesQueue = await prisma.queue.findFirst({ where: { tenantId: tenant.id, name: 'Carnival Games & Token Station' } });

  // Clean old demo visits for idempotency
  await prisma.visit.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log('🧹 Cleaned previous test visits.');

  if (!tenant) throw new Error('Tenant creation failed');

  async function getOrCreateCustomer(name: string, phone: string, email: string) {
    let cust = await prisma.customer.findFirst({
      where: { tenantId: tenant!.id, phone },
    });
    if (!cust) {
      cust = await prisma.customer.create({
        data: {
          tenantId: tenant!.id,
          name,
          phone,
          email,
        },
      });
    } else {
      cust = await prisma.customer.update({
        where: { id: cust.id },
        data: { name, email },
      });
    }
    return cust;
  }

  // Scenario 1: LETHABO NTOLO (The exact client example)
  // State: Checked in at gate, holding 4 plates entitlement, WAITING at Food Stall 1
  const custLethabo = await getOrCreateCustomer(
    'Lethabo & Kgotso Ntolo',
    '+27821234567',
    'ntolo.family@example.com',
  );

  const visitLethabo = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custLethabo.id,
      locationId: location.id,
      serviceId: foodSvc1.id,
      queueId: foodQueue1?.id,
      displayId: 'C-101',
      accessToken: 'demo-lethabo-ntolo-4plates',
      currentState: 'CHECKED_IN',
      checkInTime: new Date(Date.now() - 25 * 60 * 1000), // Checked in 25 mins ago at gate
      waitingStart: new Date(Date.now() - 25 * 60 * 1000),
      accompanyingGuests: 3, // 1 + 3 = 4 plates
      flowId: foodFlow1?.id,
      metadata: {
        childName: 'Lethabo',
        childSurname: 'Ntolo',
        gradeClass: 'Grade 4B',
        platesPurchased: 4,
        entitlementType: 'Braai Platters',
        paymentStatus: 'PAID - Card at Registration (R400.00)',
        menuTotal: 38000,
        selectedItems: [
          {
            name: 'Karoo Lamb Spit Roast Platter',
            category: 'Braai Platters & Mains',
            qty: 2,
            unitPrice: 13500,
            lineTotal: 27000,
          },
          {
            name: 'Traditional Boerewors Roll Deluxe',
            category: 'Braai Platters & Mains',
            qty: 2,
            unitPrice: 5500,
            lineTotal: 11000,
          },
        ],
      },
    },
  });

  const stepTemplate1 = foodFlow1?.steps.find((s) => s.stepOrder === 1);
  if (stepTemplate1) {
    await prisma.visitStep.create({
      data: {
        visitId: visitLethabo.id,
        tenantId: tenant.id,
        templateStepId: stepTemplate1.id,
        stepOrder: 1,
        name: stepTemplate1.name,
        type: stepTemplate1.type,
        status: 'ACTIVE',
        quantityAllocated: 4,
        quantityRedeemed: 0,
        selectedItems: [
          {
            name: 'Karoo Lamb Spit Roast Platter',
            category: 'Braai Platters & Mains',
            qty: 2,
            unitPrice: 13500,
            lineTotal: 27000,
          },
          {
            name: 'Traditional Boerewors Roll Deluxe',
            category: 'Braai Platters & Mains',
            qty: 2,
            unitPrice: 5500,
            lineTotal: 11000,
          },
        ],
      },
    });
  }

  // Scenario 2: SARAH JENKINS (Anti-Fraud & Double-Redemption Block Demo)
  // State: COMPLETED (2/2 plates collected). If scanned again, scanner blocks double issue!
  const custSarah = await getOrCreateCustomer(
    'Sarah & Michael Jenkins',
    '+27822345678',
    'jenkins.family@example.com',
  );

  const visitSarah = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custSarah.id,
      locationId: location.id,
      serviceId: foodSvc1.id,
      queueId: foodQueue1?.id,
      displayId: 'C-102',
      accessToken: 'demo-sarah-jenkins-collected',
      currentState: 'COMPLETED',
      checkInTime: new Date(Date.now() - 50 * 60 * 1000),
      serviceStart: new Date(Date.now() - 20 * 60 * 1000),
      completedAt: new Date(Date.now() - 15 * 60 * 1000),
      accompanyingGuests: 1, // 1 + 1 = 2 plates
      flowId: foodFlow1?.id,
      metadata: {
        childName: 'Sarah',
        childSurname: 'Jenkins',
        gradeClass: 'Grade 2A',
        platesPurchased: 2,
        paymentStatus: 'PAID - Online (R200.00)',
      },
    },
  });

  if (stepTemplate1) {
    await prisma.visitStep.create({
      data: {
        visitId: visitSarah.id,
        tenantId: tenant.id,
        templateStepId: stepTemplate1.id,
        stepOrder: 1,
        name: stepTemplate1.name,
        type: stepTemplate1.type,
        status: 'DONE',
        quantityAllocated: 2,
        quantityRedeemed: 2,
        lastRedeemedAt: new Date(Date.now() - 15 * 60 * 1000),
        lastRedeemedBy: 'Staff Mary',
        outcome: 'Yes – Given',
      },
    });
  }

  // Scenario 3: SIPHO NDLOVU (Partial Collection Demo)
  // State: 3 plates purchased, 1 collected, 2 still outstanding!
  const custSipho = await getOrCreateCustomer(
    'Sipho & Zanele Ndlovu',
    '+27823456789',
    'ndlovu.family@example.com',
  );

  const visitSipho = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custSipho.id,
      locationId: location.id,
      serviceId: foodSvc1.id,
      queueId: foodQueue1?.id,
      displayId: 'C-103',
      accessToken: 'demo-sipho-ndlovu-partial',
      currentState: 'IN_SERVICE',
      checkInTime: new Date(Date.now() - 40 * 60 * 1000),
      serviceStart: new Date(Date.now() - 10 * 60 * 1000),
      accompanyingGuests: 2, // 1 + 2 = 3 plates
      flowId: foodFlow1?.id,
      metadata: {
        childName: 'Sipho',
        childSurname: 'Ndlovu',
        gradeClass: 'Grade 6C',
        platesPurchased: 3,
        paymentStatus: 'PAID - EFT Bank Transfer (R300.00)',
      },
    },
  });

  if (stepTemplate1) {
    await prisma.visitStep.create({
      data: {
        visitId: visitSipho.id,
        tenantId: tenant.id,
        templateStepId: stepTemplate1.id,
        stepOrder: 1,
        name: stepTemplate1.name,
        type: stepTemplate1.type,
        status: 'ACTIVE',
        quantityAllocated: 3,
        quantityRedeemed: 1, // 1 taken, 2 left!
        lastRedeemedAt: new Date(Date.now() - 10 * 60 * 1000),
        lastRedeemedBy: 'Staff Mary',
        outcome: 'Partial Collection – 1 of 3 issued',
      },
    });
  }

  // Scenario 4: LIAM VAN DER MERWE (Food Stall 2 - Pizza Combos)
  // State: WAITING (Pre-arrival, booked online)
  const custLiam = await getOrCreateCustomer(
    'Liam & Jessica Van der Merwe',
    '+27824567890',
    'vandermerwe@example.com',
  );

  const visitLiam = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custLiam.id,
      locationId: location.id,
      serviceId: foodSvc2.id,
      queueId: foodQueue2?.id,
      displayId: 'C-104',
      accessToken: 'demo-liam-vandermerwe-combos',
      currentState: 'WAITING',
      waitingStart: new Date(Date.now() - 10 * 60 * 1000),
      accompanyingGuests: 3, // 4 combos
      flowId: foodFlow2?.id,
      metadata: {
        childName: 'Liam',
        childSurname: 'Van der Merwe',
        gradeClass: 'Grade 1B',
        mealsPurchased: 4,
        itemDetail: '2x Artisan Margherita + 2x Double Smash Cheeseburger',
        paymentStatus: 'PAID - Card (R350.00)',
        menuTotal: 35000,
        selectedItems: [
          {
            name: 'Artisan Margherita Pizza (30cm)',
            category: 'Woodfired Pizzas',
            qty: 2,
            unitPrice: 8500,
            lineTotal: 17000,
          },
          {
            name: 'Double Smash Cheeseburger & Fries',
            category: 'Burgers & Baskets',
            qty: 2,
            unitPrice: 9000,
            lineTotal: 18000,
          },
        ],
      },
    },
  });

  const stepTemplate2 = foodFlow2?.steps.find((s) => s.stepOrder === 1);
  if (stepTemplate2) {
    await prisma.visitStep.create({
      data: {
        visitId: visitLiam.id,
        tenantId: tenant.id,
        templateStepId: stepTemplate2.id,
        stepOrder: 1,
        name: stepTemplate2.name,
        type: stepTemplate2.type,
        status: 'ACTIVE',
        quantityAllocated: 4,
        quantityRedeemed: 0,
        selectedItems: [
          {
            name: 'Artisan Margherita Pizza (30cm)',
            category: 'Woodfired Pizzas',
            qty: 2,
            unitPrice: 8500,
            lineTotal: 17000,
          },
          {
            name: 'Double Smash Cheeseburger & Fries',
            category: 'Burgers & Baskets',
            qty: 2,
            unitPrice: 9000,
            lineTotal: 18000,
          },
        ],
      },
    });
  }

  // Scenario 5: AMINA PATEL (Fun Fair & Games Stall - 10 Tokens)
  const custAmina = await getOrCreateCustomer(
    'Amina & Yusuf Patel',
    '+27825678901',
    'patel.family@example.com',
  );

  const visitAmina = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custAmina.id,
      locationId: location.id,
      serviceId: gamesSvc.id,
      queueId: gamesQueue?.id,
      displayId: 'C-105',
      accessToken: 'demo-amina-patel-tokens',
      currentState: 'CHECKED_IN',
      checkInTime: new Date(Date.now() - 15 * 60 * 1000),
      waitingStart: new Date(Date.now() - 15 * 60 * 1000),
      accompanyingGuests: 0,
      flowId: gamesFlow?.id,
      metadata: {
        childName: 'Amina',
        childSurname: 'Patel',
        gradeClass: 'Grade 5A',
        tokensPurchased: 10,
        paymentStatus: 'PAID - Cash at Gate (R200.00)',
      },
    },
  });

  const stepTemplateGames = gamesFlow?.steps.find((s) => s.stepOrder === 1);
  if (stepTemplateGames) {
    await prisma.visitStep.create({
      data: {
        visitId: visitAmina.id,
        tenantId: tenant.id,
        templateStepId: stepTemplateGames.id,
        stepOrder: 1,
        name: stepTemplateGames.name,
        type: stepTemplateGames.type,
        status: 'ACTIVE',
        quantityAllocated: 10,
        quantityRedeemed: 0,
      },
    });
  }

  // Scenario 6: NOAH DLAMINI (Unlimited Passes Demo)
  // State: All-Day Unlimited Carnival Ride Pass (quantityAllocated: null, 2 rides already logged, repeatable!)
  const custNoah = await getOrCreateCustomer(
    'Noah & Chloe Dlamini',
    '+27826789012',
    'dlamini.family@example.com',
  );

  const visitNoah = await prisma.visit.create({
    data: {
      tenantId: tenant.id,
      customerId: custNoah.id,
      locationId: location.id,
      serviceId: gamesSvc.id,
      queueId: gamesQueue?.id,
      displayId: 'C-106',
      accessToken: 'demo-noah-dlamini-unlimited',
      currentState: 'CHECKED_IN',
      checkInTime: new Date(Date.now() - 60 * 60 * 1000),
      waitingStart: new Date(Date.now() - 60 * 60 * 1000),
      accompanyingGuests: 0,
      flowId: gamesFlow?.id,
      metadata: {
        childName: 'Noah',
        childSurname: 'Dlamini',
        gradeClass: 'Grade 3A',
        passType: 'All-Day Unlimited Carnival Ride Pass (∞)',
        paymentStatus: 'PAID - Online (R150.00)',
        selectedItems: [
          {
            name: 'All-Day Unlimited Carnival Ride Wristband',
            category: 'Passes & Wristbands',
            qty: 1,
            unitPrice: 15000,
            lineTotal: 15000,
          },
        ],
      },
    },
  });

  if (stepTemplateGames) {
    await prisma.visitStep.create({
      data: {
        visitId: visitNoah.id,
        tenantId: tenant.id,
        templateStepId: stepTemplateGames.id,
        stepOrder: 1,
        name: stepTemplateGames.name,
        type: stepTemplateGames.type,
        status: 'ACTIVE',
        quantityAllocated: null, // Unlimited!
        quantityRedeemed: 2, // 2 rides logged so far
        lastRedeemedAt: new Date(Date.now() - 15 * 60 * 1000),
        lastRedeemedBy: 'Staff Sipho',
        outcome: 'Unlimited Pass Active – 2 scans logged',
        selectedItems: [
          {
            name: 'All-Day Unlimited Carnival Ride Wristband',
            category: 'Passes & Wristbands',
            qty: 1,
            unitPrice: 15000,
            lineTotal: 15000,
          },
        ],
      },
    });
  }

  console.log('\n========================================================================');
  console.log('🎉 PRODUCTION DEMO SETUP COMPLETE FOR SCHOOL ANNUAL CONCERT & FAIR');
  console.log('========================================================================');
  console.log('🏢 Tenant Name:       ', tenant.name);
  console.log('🌐 Subdomain:         ', tenant.subdomain);
  console.log('📍 Public Portal:     ', `https://${tenant.subdomain}.qmova.yqbuddy.com/booking`);
  console.log('📊 Admin Dashboard:   ', `https://${tenant.subdomain}.qmova.yqbuddy.com/dashboard/service-desk`);
  console.log('📷 Gate/Food Scanner: ', `https://${tenant.subdomain}.qmova.yqbuddy.com/dashboard/scan`);
  console.log('------------------------------------------------------------------------');
  console.log('🔐 Admin Login:');
  console.log('   Email:             ', adminEmail);
  console.log('   Password:          ', 'SchoolEvent2026!');
  console.log('------------------------------------------------------------------------');
  console.log('🎯 DEMO SCENARIOS PRE-LOADED:');
  console.log('   1. Lethabo Ntolo (Grade 4B, 4 Plates, Checked In, 2x Spit Braai + 2x Boerewors):');
  console.log('      Token / QR:     ', visitLethabo.accessToken);
  console.log('      Ticket URL:     ', `https://${tenant.subdomain}.qmova.yqbuddy.com/ticket/${visitLethabo.accessToken}`);
  console.log('   2. Sarah Jenkins (Grade 2A, 2 Plates, Collected - Double Block Demo):');
  console.log('      Token / QR:     ', visitSarah.accessToken);
  console.log('      Ticket URL:     ', `https://${tenant.subdomain}.qmova.yqbuddy.com/ticket/${visitSarah.accessToken}`);
  console.log('   3. Sipho Ndlovu (Grade 6C, 3 Plates, 1 of 3 Collected Partial):');
  console.log('      Token / QR:     ', visitSipho.accessToken);
  console.log('      Ticket URL:     ', `https://${tenant.subdomain}.qmova.yqbuddy.com/ticket/${visitSipho.accessToken}`);
  console.log('   4. Liam Van der Merwe (Food Stall 2, 4 Combos with Margherita & Burgers):');
  console.log('      Token / QR:     ', visitLiam.accessToken);
  console.log('   5. Amina Patel (Games Stall, 10 Tokens):');
  console.log('      Token / QR:     ', visitAmina.accessToken);
  console.log('   6. Noah Dlamini (Carnival Arena, All-Day Unlimited Pass - ∞ Redemptions):');
  console.log('      Token / QR:     ', visitNoah.accessToken);
  console.log('      Ticket URL:     ', `https://${tenant.subdomain}.qmova.yqbuddy.com/ticket/${visitNoah.accessToken}`);
  console.log('========================================================================\n');

  await pool.end();
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

