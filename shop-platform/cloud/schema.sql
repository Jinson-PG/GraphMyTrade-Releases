-- GraphMyTrade Store, Cloudflare D1. No payments or customer PII yet.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  price_inr INTEGER NOT NULL DEFAULT 99 CHECK (price_inr BETWEEN 1 AND 99),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  cover_key TEXT,
  digital_file_key TEXT,
  filename TEXT,
  compatibility TEXT NOT NULL DEFAULT '',
  license_text TEXT NOT NULL DEFAULT '',
  includes_json TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  keywords_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  approved_at TEXT,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_status_published ON products(status,published_at);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category,status);
CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  action TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Owner-defined departments: not limited to trading-specific products.
CREATE TABLE IF NOT EXISTS shop_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 500,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shop_categories_sort ON shop_categories(active,sort_order,name);
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('courses','Courses',0,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('strategies','Strategies',10,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('notion','Notion Templates',20,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('excel','Excel & Sheets',30,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('calculators','Calculators',40,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('guides','E-books & PDFs',50,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('checklists','Checklists',60,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('bundles','Bundles',70,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('bots','Telegram Bots',80,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('extensions','Extensions',90,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('software','Software Tools',100,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('scripts','Scripts',110,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('indicators','Indicators',120,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('education','Study & Education',130,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('career','Jobs & Resumes',140,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('business','Business Tools',150,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('finance','Personal Finance',160,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('design','Design Assets',170,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('planners','Life & Productivity',180,1,'2026-10-21T00:00:00Z');
INSERT OR IGNORE INTO shop_categories(slug,name,sort_order,active,created_at) VALUES('services','Digital Services',190,1,'2026-10-21T00:00:00Z');