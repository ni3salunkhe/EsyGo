-- ============================================================================
-- Data-integrity invariants. EVERY row of the result must show violations = 0.
-- Run after any test run or manual session:  scripts/verify-invariants.sh
-- Thresholds: "stale" checks allow 2 minutes of expiry-job lag (job runs 60 s).
-- ============================================================================
SELECT 'INV-01 active booking holds exactly nights room_night rows' AS check_name, COUNT(*) AS violations FROM (
  SELECT b.id FROM booking b LEFT JOIN room_night rn ON rn.booking_id = b.id
  WHERE b.status IN ('HELD','CONFIRMED')
  GROUP BY b.id, b.nights HAVING COUNT(rn.stay_date) <> b.nights
) v
UNION ALL
SELECT 'INV-02 night status matches booking status (HELD->RESERVED, CONFIRMED->BOOKED); inactive bookings hold no nights', COUNT(*) FROM (
  SELECT rn.room_id, rn.stay_date FROM booking b JOIN room_night rn ON rn.booking_id = b.id
  WHERE (b.status = 'HELD' AND rn.status <> 'RESERVED')
     OR (b.status = 'CONFIRMED' AND rn.status <> 'BOOKED')
     OR b.status IN ('CANCELLED','EXPIRED')
) v
UNION ALL
SELECT 'INV-03 room_night internal consistency (status vs booking_id vs reserved_until)', COUNT(*) FROM room_night
  WHERE (status = 'AVAILABLE' AND (booking_id IS NOT NULL OR reserved_until IS NOT NULL))
     OR (status IN ('RESERVED','BOOKED') AND booking_id IS NULL)
     OR (status = 'RESERVED' AND reserved_until IS NULL)
     OR (status = 'BOOKED' AND reserved_until IS NOT NULL)
     OR status NOT IN ('AVAILABLE','RESERVED','BOOKED')
UNION ALL
SELECT 'INV-04 a held night belongs to the booking room and lies inside [check_in, check_out)', COUNT(*) FROM (
  SELECT rn.room_id FROM room_night rn JOIN booking b ON b.id = rn.booking_id
  WHERE rn.room_id <> b.room_id OR rn.stay_date < b.check_in OR rn.stay_date >= b.check_out
) v
UNION ALL
SELECT 'INV-05 no double booking: no two active bookings overlap on the same room', COUNT(*) FROM (
  SELECT a.id FROM booking a JOIN booking b ON a.room_id = b.room_id AND a.id < b.id
  WHERE a.status IN ('HELD','CONFIRMED') AND b.status IN ('HELD','CONFIRMED')
    AND a.check_in < b.check_out AND b.check_in < a.check_out
) v
UNION ALL
SELECT 'INV-06 price math: nights = check_out - check_in and total = nights * price_per_night', COUNT(*) FROM booking
  WHERE nights <> DATEDIFF(check_out, check_in) OR total_amount <> nights * price_per_night
UNION ALL
SELECT 'INV-07 booking.hotel_id matches the hotel of its room', COUNT(*) FROM booking b JOIN room r ON r.id = b.room_id
  WHERE r.hotel_id <> b.hotel_id
UNION ALL
SELECT 'INV-08 expires_at: required while HELD, cleared on CONFIRMED (cancel/expire leave it as-is); valid status values only', COUNT(*) FROM booking
  WHERE (status = 'HELD' AND expires_at IS NULL)
     OR (status = 'CONFIRMED' AND expires_at IS NOT NULL)
     OR status NOT IN ('HELD','CONFIRMED','CANCELLED','EXPIRED')
UNION ALL
SELECT 'INV-09 stale holds: HELD booking expired more than 2 minutes ago (expiry job lagging or broken)', COUNT(*) FROM booking
  WHERE status = 'HELD' AND expires_at < NOW() - INTERVAL 2 MINUTE
UNION ALL
SELECT 'INV-10 stale reservations: RESERVED night past reserved_until by more than 2 minutes', COUNT(*) FROM room_night
  WHERE status = 'RESERVED' AND reserved_until < NOW() - INTERVAL 2 MINUTE;
