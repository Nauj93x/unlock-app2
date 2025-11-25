-- Insert sample events
INSERT INTO public.events (name, description, date, time, location, max_capacity, qr_code, created_by) VALUES
('Conferencia Tech 2024', 'Conferencia anual de tecnología', '2024-12-15', '09:00:00', 'Centro de Convenciones', 200, 'QR_TECH2024', NULL),
('Workshop de Desarrollo Web', 'Taller práctico de desarrollo web moderno', '2024-12-20', '14:00:00', 'Aula Magna', 50, 'QR_WEBDEV24', NULL),
('Networking Night', 'Evento de networking para profesionales', '2024-12-22', '19:00:00', 'Hotel Plaza', 100, 'QR_NETWORK24', NULL);

-- Insert sample accommodations
INSERT INTO public.accommodations (name, type, description, capacity, price_per_night, amenities) VALUES
('Suite Ejecutiva', 'suite', 'Suite de lujo con vista al mar', 2, 250.00, ARRAY['wifi', 'tv', 'minibar', 'balcón']),
('Habitación Doble', 'habitacion', 'Habitación cómoda para dos personas', 2, 120.00, ARRAY['wifi', 'tv', 'aire_acondicionado']),
('Habitación Individual', 'habitacion', 'Habitación individual moderna', 1, 80.00, ARRAY['wifi', 'tv', 'escritorio']),
('Apartamento Familiar', 'apartamento', 'Apartamento completo para familias', 4, 180.00, ARRAY['wifi', 'cocina', 'sala', 'balcón']);
