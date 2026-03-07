-- Добавление поля image_url в таблицу news
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Комментарий
COMMENT ON COLUMN news.image_url IS 'URL изображения для новости';
