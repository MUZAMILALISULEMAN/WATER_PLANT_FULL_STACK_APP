/*******************************************************************************
    CUSTOMER MANAGEMENT SYSTEM - SQL BACKUP
*******************************************************************************/

-- [FUNCTION]: display_customer
-- Purpose: Retrieves full details for a specific customer by their ID.
-- CREATE OR REPLACE FUNCTION display_customer(ID int)
-- RETURNS TABLE (
-- f_cust_id INT,
-- f_name VARCHAR,
-- f_cell_phone VARCHAR,
-- f_address TEXT,
-- f_unit_price INT,
-- f_is_active bool,
-- f_active_status_changed_at TIMESTAMP,
-- f_advance_money INT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN

-- 	IF ID is NULL OR ID < 0 THEN
-- 		RAISE EXCEPTION 'id is negative, enter correct id.';
-- 	END IF;
	
-- 	RETURN QUERY 
--      SELECT * FROM Customers where cust_id = ID;
-- END;
-- $$;

-- [FUNCTION]: SEARCH_CUSTOMER
-- Purpose: Searches for customers by partial name or ID with custom sorting.
-- CREATE OR REPLACE FUNCTION SEARCH_CUSTOMER(IN Q TEXT)
-- RETURNS TABLE
-- (
-- f_cust_id INT,
-- f_name VARCHAR
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN

-- 	Q:= lower(trim(Q));
-- 	IF Q is NULL OR Q = '' THEN
-- 		RAISE EXCEPTION 'input is null or empty.';
-- 	END IF;

-- 	RETURN QUERY
-- 	SELECT cust_id,name from customers where (name LIKE '%' || Q || '%') OR (cust_id::TEXT LIKE Q || '%')
-- 	order by name Like (Q || '%') DESC,
-- 	(cust_id::TEXT = Q) DESC,
-- 	name ASC;

-- END;
-- $$; 

-- [PROCEDURE]: add_customer
-- Purpose: Validates and inserts a new customer record.
-- CREATE OR REPLACE PROCEDURE add_customer(
--      p_name VARCHAR,
--      p_cell_phone VARCHAR,
--      p_address TEXT,
--      p_unit_price INT,
--      p_is_active BOOLEAN DEFAULT TRUE,
--      p_advance_money INT DEFAULT 0  
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN 
--      -- 1. Data Cleaning
--      p_name := lower(trim(p_name));
--      p_cell_phone := trim(p_cell_phone); 
--      p_address := lower(trim(p_address));
    
--      -- 2. Validation 
--      IF p_name IS NULL OR p_name = '' THEN
--          RAISE EXCEPTION 'Name cannot be empty or null';
--      END IF;

-- 	IF (SELECT 1 FROM CUSTOMERS WHERE name = p_name) THEN
-- 		  RAISE EXCEPTION 'Name cannot be duplicate';
--      END IF;


--      IF p_cell_phone IS NULL OR p_cell_phone = ''  OR p_cell_phone !~ '^03[0-9]{9}$' THEN
--          RAISE EXCEPTION 'Cell phone cannot be null or empty or contains letter/symbols';
--      END IF;
	 
--      -- Check for duplicate phone numbers
--      IF EXISTS (SELECT 1 FROM customers WHERE cell_phone = p_cell_phone) THEN
--          RAISE EXCEPTION 'This cell phone (%) is already registered to another customer', p_cell_phone;
--      END IF;

--      IF p_address IS NULL THEN
--          RAISE EXCEPTION 'Address cannot be null';
--      END IF;
    
--      IF p_unit_price IS NULL OR p_unit_price < 0 THEN
--          RAISE EXCEPTION 'Bottle price must be 0 or greater';
--      END IF;

 
--      IF p_advance_money IS NULL OR p_advance_money < 0 THEN
-- 		RAISE EXCEPTION 'advance money is null or it should be greater than or equal to 0';
--      END IF;

--      -- 3. Insertion
--      INSERT INTO customers (
--          name, 
--          cell_phone, 
--          address, 
--          unit_price, 
--          is_active, 
--          advance_money
--      ) 
--      VALUES (
--          p_name, 
--          p_cell_phone, 
--          p_address, 
--          p_unit_price, 
--          p_is_active, 
--          p_advance_money
--      );


-- END;
-- $$;

-- [PROCEDURE]: UPDATE_CUSTOMER
-- Purpose: Updates specific customer fields dynamically using JSONB input.
-- CREATE OR REPLACE PROCEDURE UPDATE_CUSTOMER(IN ID INT, IN p_updates JSONB)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--      -- 1. Initial Validation
--      IF p_updates IS NULL OR ID IS NULL OR ID < 0 THEN
--          RAISE EXCEPTION 'updates are not given, id is null or empty.';
--      END IF;

--      -- 2. Field Validations (Using single quotes for keys)
--      IF p_updates ? 'unit_price' AND ((p_updates->>'unit_price') IS NULL OR (p_updates->>'unit_price')::INT < 0) THEN
--          RAISE EXCEPTION 'price is null or bottle price must be 0 or greater';
--      END IF;

--      IF p_updates ? 'name' AND ((p_updates->>'name') IS NULL OR (p_updates->>'name') = '') THEN
--          RAISE EXCEPTION 'name is null or empty.';
--      END IF;

-- 		IF (SELECT 1 FROM CUSTOMERS WHERE name = p_updates->>'name') THEN
-- 		  RAISE EXCEPTION 'name cannot be duplicate';
--      END IF;
		

--      IF p_updates ? 'cell_phone' AND ((p_updates->>'cell_phone') IS NULL OR (p_updates->>'cell_phone') = '' OR (p_updates->>'cell_phone') !~ '^\+?[0-9]+$') THEN
--          RAISE EXCEPTION 'Cell phone cannot be null or empty or contains letter/symbols';
--      END IF;
     
--      -- Check for duplicate phone numbers
--      IF p_updates ? 'cell_phone' AND EXISTS (SELECT 1 FROM customers WHERE cell_phone = trim(p_updates->>'cell_phone') AND cust_id != ID) THEN
--          RAISE EXCEPTION 'This cell phone (%) is already registered to another customer', p_updates->>'cell_phone';
--      END IF;

--      IF p_updates ? 'address' AND (p_updates->>'address') IS NULL THEN
--          RAISE EXCEPTION 'Address cannot be null';
--      END IF;

--      IF p_updates ? 'advance_money' AND ((p_updates->>'advance_money') IS NULL OR (p_updates->>'advance_money')::INT < 0) THEN
--          RAISE EXCEPTION 'advance money is null or it should be greater than or equal to 0';
--      END IF;

--      -- 3. The Actual Update
--      UPDATE customers
--      SET  
--          name = COALESCE(lower(trim(p_updates->>'name')), name),
--          cell_phone = COALESCE(trim(p_updates->>'cell_phone'), cell_phone),
--          address = COALESCE(lower(trim(p_updates->>'address')), address),
--          unit_price = COALESCE((p_updates->>'unit_price')::INT, unit_price),
--          advance_money = COALESCE((p_updates->>'advance_money')::INT, advance_money)
--      WHERE cust_id = ID;
    
-- END;
-- $$;

-- [PROCEDURE]: DEACTIVATE_CUSTOMER
-- Purpose: Sets a customer's active status to FALSE and logs the timestamp.
-- CREATE OR REPLACE PROCEDURE DEACTIVATE_CUSTOMER(ID int)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN

-- 	IF ID is NULL OR ID < 0 THEN
-- 		RAISE EXCEPTION 'id is negative, enter correct id.';
-- 	END IF;
	
--      UPDATE customers
-- 	SET is_active = FALSE,
-- 	active_status_changed_at = CURRENT_TIMESTAMP 
-- 	WHERE cust_id = ID;
-- END;
-- $$;

-- [PROCEDURE]: ACTIVATE_CUSTOMER
-- Purpose: Sets a customer's active status to TRUE and logs the timestamp.
-- CREATE OR REPLACE PROCEDURE ACTIVATE_CUSTOMER(ID int)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN

-- 	IF ID is NULL OR ID < 0 THEN
-- 		RAISE EXCEPTION 'id is negative, enter correct id.';
-- 	END IF;
	
--      UPDATE customers
-- 	SET is_active = TRUE,
-- 	active_status_changed_at = CURRENT_TIMESTAMP 
-- 	WHERE cust_id = ID;
-- END;
-- $$;

-- [PROCEDURE]: SET_ADVANCE_MONEY
-- Purpose: Manually sets the advance money amount for a specific customer.
-- CREATE OR REPLACE PROCEDURE SET_ADVANCE_MONEY(ID int,MONEY int)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN

-- 	IF ID is NULL OR ID < 0 THEN
-- 		RAISE EXCEPTION 'id is negative, enter correct id.';
-- 	END IF;
-- 	IF MONEY is NULL OR MONEY < 0 THEN
-- 		RAISE EXCEPTION 'money is not correct.';
-- 	END IF;
	
--   UPDATE customers
-- 	SET advance_money = MONEY
-- 	WHERE cust_id = ID;

-- END;
-- $$;

-- /*******************************************************************************
--     SCRIPTS & TESTING CALLS
-- *******************************************************************************/

-- select * from customer_filter_by_active();
-- CALL add_customer('ali sulemaj','03231255004','Karachi Port Qasim',70,TRUE,0);
-- CALL ACTIVATE_CUSTOMER(8);
-- CALL SET_ADVANCE_MONEY(8,0);
-- SELECT * FROM display_all_customers();
-- delete from customers;
-- CALL UPDATE_CUSTOMER(6,'{"cell_phone": "03122551504"}');
-- CALL update_customer(13,'{"advance_money":90}');
-- call add_customer('Muzamil Ali','03122155031','',0);
-- select * from  display_all_customers();
-- CALL DEACTIVATE_CUSTOMER(11);
-- select * from customer_filter_by_active();
select * from customers;