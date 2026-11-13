package com.hotelbooking.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * Generates unique booking references.
 * Format: HB- + 6 characters from ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no 0, O, 1, I, L).
 */
@Service
public class ReferenceGenerator {

    public static final String PREFIX = "HB-";
    public static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    public static final int CODE_LENGTH = 6;
    private static final int MAX_COLLISION_RETRIES = 10;

    private final SecureRandom random = new SecureRandom();

    /**
     * Generates a raw reference code.
     */
    public String generateReference() {
        char[] chars = new char[CODE_LENGTH];
        for (int i = 0; i < CODE_LENGTH; i++) {
            chars[i] = ALPHABET.charAt(random.nextInt(ALPHABET.length()));
        }
        return PREFIX + new String(chars);
    }

    /**
     * Generates a unique reference, retrying if a collision is detected.
     *
     * @param existsPredicate predicate returning true if the reference already exists
     * @return unique booking reference
     */
    public String generateUniqueReference(Predicate<String> existsPredicate) {
        for (int attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
            String candidate = generateReference();
            if (!existsPredicate.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Exceeded maximum collision retries while generating booking reference");
    }
}
