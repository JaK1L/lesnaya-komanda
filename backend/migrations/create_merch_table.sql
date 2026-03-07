-- Создаем таблицу товаров
CREATE TABLE IF NOT EXISTS merch (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(50),
    sizes VARCHAR(200),
    in_stock BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_merch_in_stock ON merch(in_stock);
CREATE INDEX IF NOT EXISTS idx_merch_category ON merch(category);
CREATE INDEX IF NOT EXISTS idx_merch_order ON merch(display_order);

-- Комментарии
COMMENT ON TABLE merch IS 'Товары магазина';
COMMENT ON COLUMN merch.sizes IS 'Доступные размеры через запятую (S, M, L, XL)';
COMMENT ON COLUMN merch.category IS 'Категория товара (футболки, худи, аксессуары)';
COMMENT ON COLUMN merch.in_stock IS 'Есть ли товар в наличии';
