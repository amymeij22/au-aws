-- Tambahkan unique constraint pada kolom timestamp dengan cara yang aman
DO $$
BEGIN
    -- Cek apakah constraint sudah ada
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'weather_data_timestamp_unique'
    ) THEN
        -- Jika belum ada, tambahkan constraint
        ALTER TABLE weather_data 
        ADD CONSTRAINT weather_data_timestamp_unique UNIQUE (timestamp);
    END IF;
END $$;

-- Tambahkan indeks pada kolom timestamp untuk meningkatkan performa pencarian
CREATE INDEX IF NOT EXISTS weather_data_timestamp_idx 
ON weather_data(timestamp);

-- Fungsi untuk membersihkan data duplikat yang mungkin sudah ada
CREATE OR REPLACE FUNCTION remove_weather_data_duplicates() 
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  WITH duplicate_rows AS (
    SELECT id,
    ROW_NUMBER() OVER (PARTITION BY timestamp ORDER BY id) as row_num
    FROM weather_data
  )
  DELETE FROM weather_data
  WHERE id IN (
    SELECT id 
    FROM duplicate_rows 
    WHERE row_num > 1
  );
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk memeriksa data dengan timestamp tertentu sudah ada atau belum
CREATE OR REPLACE FUNCTION check_weather_data_exists(p_timestamp TIMESTAMPTZ) 
RETURNS BOOLEAN AS $$
DECLARE
  data_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM weather_data 
    WHERE timestamp = p_timestamp
  ) INTO data_exists;
  
  RETURN data_exists;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk mencegah duplikasi data berdasarkan timestamp
CREATE OR REPLACE FUNCTION prevent_weather_data_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  -- Cek apakah data dengan timestamp yang sama sudah ada
  IF EXISTS (
    SELECT 1 
    FROM weather_data 
    WHERE timestamp = NEW.timestamp
    AND id != NEW.id
  ) THEN
    RAISE NOTICE 'Data dengan timestamp % sudah ada, skip insert/update', NEW.timestamp;
    RETURN NULL; -- Batalkan operasi INSERT/UPDATE
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk mencegah duplikasi
DROP TRIGGER IF EXISTS tr_prevent_duplicates ON weather_data;

CREATE TRIGGER tr_prevent_duplicates
BEFORE INSERT OR UPDATE ON weather_data
FOR EACH ROW
EXECUTE FUNCTION prevent_weather_data_duplicates();

-- Fungsi untuk membersihkan duplikat secara otomatis setiap jam
CREATE OR REPLACE FUNCTION auto_clean_weather_data_duplicates()
RETURNS void AS $$
BEGIN
  -- Panggil fungsi untuk menghapus duplikat
  PERFORM remove_weather_data_duplicates();
  
  -- Log informasi
  RAISE NOTICE 'Auto clean duplicates executed at %', NOW();
END;
$$ LANGUAGE plpgsql; 