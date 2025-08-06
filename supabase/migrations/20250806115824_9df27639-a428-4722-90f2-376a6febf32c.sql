-- Check and fix foreign key constraints
-- First, add cascade delete for transactions when customer is deleted
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_customer_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Do the same for tray_transactions
ALTER TABLE tray_transactions 
DROP CONSTRAINT IF EXISTS tray_transactions_customer_id_fkey;

ALTER TABLE tray_transactions
ADD CONSTRAINT tray_transactions_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;