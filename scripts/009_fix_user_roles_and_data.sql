-- Update PruebaAdmin user to have administrator role
UPDATE profiles 
SET role = 'administrador' 
WHERE email = 'juanpi240205@gmail.com' OR full_name = 'PruebaAdmin';

-- Insert some sample events for testing
INSERT INTO events (id, name, description, location, date, time, max_capacity, current_capacity, status, created_by) VALUES
(gen_random_uuid(), 'Conferencia Tech 2024', 'Conferencia anual de tecnología', 'Centro de Convenciones', '2024-12-15', '09:00:00', 200, 0, 'activo', (SELECT id FROM profiles WHERE role = 'administrador' LIMIT 1)),
(gen_random_uuid(), 'Workshop de React', 'Taller práctico de React y Next.js', 'Aula 101', '2024-12-20', '14:00:00', 50, 0, 'activo', (SELECT id FROM profiles WHERE role = 'administrador' LIMIT 1)),
(gen_random_uuid(), 'Networking Night', 'Evento de networking para desarrolladores', 'Rooftop Bar', '2024-12-22', '18:00:00', 100, 0, 'activo', (SELECT id FROM profiles WHERE role = 'administrador' LIMIT 1));

-- Insert some sample accommodations
INSERT INTO accommodations (id, name, description, type, capacity, price_per_night, amenities, status) VALUES
(gen_random_uuid(), 'Suite Ejecutiva', 'Suite de lujo con vista al mar', 'suite', 2, 250.00, ARRAY['wifi', 'tv', 'minibar', 'balcon'], 'disponible'),
(gen_random_uuid(), 'Habitación Doble', 'Habitación cómoda para dos personas', 'doble', 2, 120.00, ARRAY['wifi', 'tv', 'aire_acondicionado'], 'disponible'),
(gen_random_uuid(), 'Habitación Individual', 'Habitación perfecta para una persona', 'individual', 1, 80.00, ARRAY['wifi', 'tv'], 'disponible');
