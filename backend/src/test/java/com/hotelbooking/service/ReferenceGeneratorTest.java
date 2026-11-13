package com.hotelbooking.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReferenceGeneratorTest {

    private final ReferenceGenerator generator = new ReferenceGenerator();
    private static final Pattern REFERENCE_PATTERN = Pattern.compile("^HB-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$");

    @Test
    @DisplayName("REF-01: format matches 'HB-' + 6 chars from allowed alphabet")
    void referenceFormat_matchesExpectedPattern() {
        for (int i = 0; i < 100; i++) {
            String reference = generator.generateReference();
            assertThat(reference).matches(REFERENCE_PATTERN);
            assertThat(reference).hasSize(9);
            assertThat(reference).startsWith("HB-");
        }
    }

    @Test
    @DisplayName("REF-02: no excluded characters (0, O, 1, I, L) across 10,000 generated samples")
    void referenceAlphabet_excludesConfusingCharactersOver10000Samples() {
        char[] forbidden = {'0', 'O', '1', 'I', 'L', 'o', 'i', 'l'};

        for (int i = 0; i < 10_000; i++) {
            String ref = generator.generateReference();
            String code = ref.substring(3);
            for (char f : forbidden) {
                assertThat(code)
                        .withFailMessage("Reference %s contains forbidden character %c", ref, f)
                        .doesNotContain(String.valueOf(f));
            }
        }
    }

    @Test
    @DisplayName("REF-03: collision is detected and handled by retry")
    void collisionHandledByRetry() {
        AtomicInteger attempts = new AtomicInteger(0);

        // Simulate collision on first attempt, success on second
        String uniqueRef = generator.generateUniqueReference(candidate -> {
            int attempt = attempts.incrementAndGet();
            return attempt == 1; // Collision on attempt 1
        });

        assertThat(uniqueRef).matches(REFERENCE_PATTERN);
        assertThat(attempts.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("REF-04: exceeds max retries throws IllegalStateException")
    void exceedsMaxRetries_throwsException() {
        // Always report collision
        assertThatThrownBy(() -> generator.generateUniqueReference(candidate -> true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Exceeded maximum collision retries");
    }
}
