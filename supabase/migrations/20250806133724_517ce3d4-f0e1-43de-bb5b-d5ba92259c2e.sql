-- Add proper foreign key constraints for cascading deletes
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_customer
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE tray_transactions
ADD CONSTRAINT fk_tray_transactions_customer  
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;